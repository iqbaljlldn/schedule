import { db } from '#server/database';
import { schedules, classes } from '#server/database/schema';
import { eq, and } from 'drizzle-orm';
import { requireTeacher } from '#server/utils/auth';
import { z } from 'zod';

const swapSchema = z.object({
  targetScheduleId: z.string().min(1)
});

export default defineEventHandler(async (event) => {
  const teacher = requireTeacher(event);
  const classId = getRouterParam(event, 'classId');
  const scheduleId = getRouterParam(event, 'scheduleId');
  const body = await readBody(event);
  const parsed = swapSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Pilih jadwal target untuk ditukar' });
  }

  const { targetScheduleId } = parsed.data;

  // Verify class ownership
  const classList = await db.select().from(classes).where(and(eq(classes.id, classId!), eq(classes.teacherId, teacher.userId)));
  if (classList.length === 0) throw createError({ statusCode: 403, statusMessage: 'Forbidden' });

  const item1 = await db.select().from(schedules).where(and(eq(schedules.id, scheduleId!), eq(schedules.classId, classId!)));
  const item2 = await db.select().from(schedules).where(and(eq(schedules.id, targetScheduleId), eq(schedules.classId, classId!)));

  if (item1.length === 0 || item2.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Jadwal tidak ditemukan' });
  }

  const s1 = item1[0];
  const s2 = item2[0];

  // Swap studentId and notes
  await db.update(schedules).set({
    studentId: s2.studentId,
    note: s2.note,
    topicTitle: s2.topicTitle
  }).where(eq(schedules.id, s1.id));

  await db.update(schedules).set({
    studentId: s1.studentId,
    note: s1.note,
    topicTitle: s1.topicTitle
  }).where(eq(schedules.id, s2.id));

  return { success: true, message: 'Jadwal berhasil ditukar.' };
});

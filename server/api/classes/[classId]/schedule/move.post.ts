import { db } from '#server/database';
import { schedules, classes } from '#server/database/schema';
import { eq, and, asc } from 'drizzle-orm';
import { requireTeacher } from '#server/utils/auth';
import { getTodayDateString, recalculateDatesArray } from '#server/utils/scheduler';
import { z } from 'zod';

const moveSchema = z.object({
  scheduleId: z.string().min(1),
  direction: z.enum(['up', 'down'])
});

export default defineEventHandler(async (event) => {
  const teacher = requireTeacher(event);
  const classId = getRouterParam(event, 'classId');
  const body = await readBody(event);
  const parsed = moveSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Parameter geser tidak valid' });
  }

  const { scheduleId, direction } = parsed.data;

  // Verify class
  const classList = await db.select().from(classes).where(and(eq(classes.id, classId!), eq(classes.teacherId, teacher.userId)));
  if (classList.length === 0) throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  const cls = classList[0];
  const today = getTodayDateString(cls.timezone);

  const allSchedules = await db
    .select()
    .from(schedules)
    .where(eq(schedules.classId, classId!))
    .orderBy(asc(schedules.date), asc(schedules.sessionNumber));

  const targetIdx = allSchedules.findIndex(s => s.id === scheduleId);
  if (targetIdx === -1) throw createError({ statusCode: 404, statusMessage: 'Jadwal tidak ditemukan' });

  const neighborIdx = direction === 'up' ? targetIdx - 1 : targetIdx + 1;
  if (neighborIdx < 0 || neighborIdx >= allSchedules.length) {
    return { success: false, message: 'Tidak dapat digeser lebih jauh' };
  }

  const item = allSchedules[targetIdx];
  const neighbor = allSchedules[neighborIdx];

  if (item.status === 'completed' || neighbor.status === 'completed' || item.date < today || neighbor.date < today) {
    throw createError({ statusCode: 400, statusMessage: 'Jadwal yang sudah selesai atau lewat tidak dapat digeser.' });
  }

  // Swap
  allSchedules[targetIdx] = neighbor;
  allSchedules[neighborIdx] = item;

  const recalculated = recalculateDatesArray(allSchedules, cls.classDays, today);
  for (const s of recalculated) {
    await db.update(schedules).set({ date: s.date }).where(eq(schedules.id, s.id));
  }

  return { success: true, message: 'Urutan berhasil dipindahkan.' };
});

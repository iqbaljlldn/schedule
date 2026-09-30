import { db } from '#server/database';
import { students, classes, schedules } from '#server/database/schema';
import { eq, and, asc } from 'drizzle-orm';
import { requireTeacher } from '#server/utils/auth';
import { getTodayDateString, getNextClassDate } from '#server/utils/scheduler';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

const addStudentSchema = z.object({
  name: z.string().min(2, 'Nama siswa minimal 2 karakter'),
  studentNumber: z.string().optional(),
  addToSchedule: z.boolean().default(true)
});

export default defineEventHandler(async (event) => {
  const teacher = requireTeacher(event);
  const classId = getRouterParam(event, 'classId');
  const body = await readBody(event);
  const parsed = addStudentSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message || 'Input tidak valid' });
  }

  const { name, studentNumber, addToSchedule } = parsed.data;

  // Verify class
  const classList = await db.select().from(classes).where(and(eq(classes.id, classId!), eq(classes.teacherId, teacher.userId)));
  if (classList.length === 0) throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  const cls = classList[0];
  const today = getTodayDateString(cls.timezone);

  const studentId = `student-${randomUUID().slice(0, 8)}`;
  const insertedStudent = await db.insert(students).values({
    id: studentId,
    classId: classId!,
    name: name.trim(),
    studentNumber: studentNumber || null,
    active: true
  }).returning();

  if (addToSchedule) {
    const allSchedules = await db
      .select()
      .from(schedules)
      .where(eq(schedules.classId, classId!))
      .orderBy(asc(schedules.date));

    const lastDate = allSchedules.length > 0 ? allSchedules[allSchedules.length - 1].date : today;
    const nextDate = getNextClassDate(lastDate, cls.classDays);

    await db.insert(schedules).values({
      id: `sched-${randomUUID().slice(0, 8)}`,
      classId: classId!,
      studentId,
      date: nextDate,
      round: cls.currentRound || 1,
      sessionNumber: allSchedules.length + 1,
      status: 'scheduled'
    });
  }

  return { success: true, student: insertedStudent[0] };
});

import { db } from '#server/database';
import { schedules, classes, students } from '#server/database/schema';
import { eq, and, asc } from 'drizzle-orm';
import { requireTeacher } from '#server/utils/auth';
import { getTodayDateString, getNextClassDate } from '#server/utils/scheduler';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

const nextRoundSchema = z.object({
  shuffle: z.boolean().default(false)
});

export default defineEventHandler(async (event) => {
  const teacher = requireTeacher(event);
  const classId = getRouterParam(event, 'classId');
  const body = await readBody(event).catch(() => ({}));
  const parsed = nextRoundSchema.safeParse(body);
  const shuffle = parsed.success ? parsed.data.shuffle : false;

  const classList = await db.select().from(classes).where(and(eq(classes.id, classId!), eq(classes.teacherId, teacher.userId)));
  if (classList.length === 0) throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  const cls = classList[0];
  const today = getTodayDateString(cls.timezone);

  const allSchedules = await db
    .select()
    .from(schedules)
    .where(eq(schedules.classId, classId!))
    .orderBy(asc(schedules.date));

  const currentMaxRound = allSchedules.reduce((max, s) => Math.max(max, s.round || 1), 1);
  const nextRound = currentMaxRound + 1;

  // Determine starting date
  const lastDate = allSchedules.length > 0 ? allSchedules[allSchedules.length - 1].date : today;
  let nextDate = getNextClassDate(lastDate, cls.classDays);

  const activeStudents = await db
    .select()
    .from(students)
    .where(and(eq(students.classId, classId!), eq(students.active, true)))
    .orderBy(asc(students.orderIndex));

  if (activeStudents.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada siswa aktif untuk dijadwalkan.' });
  }

  let studentIds = activeStudents.map(s => s.id);
  if (shuffle) {
    for (let i = studentIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [studentIds[i], studentIds[j]] = [studentIds[j], studentIds[i]];
    }
  }

  // Insert next round entries
  for (let i = 0; i < studentIds.length; i++) {
    await db.insert(schedules).values({
      id: `sched-${randomUUID().slice(0, 8)}`,
      classId: classId!,
      studentId: studentIds[i],
      date: nextDate,
      round: nextRound,
      sessionNumber: allSchedules.length + i + 1,
      status: 'scheduled'
    });
    nextDate = getNextClassDate(nextDate, cls.classDays);
  }

  // Update current round in class
  await db.update(classes).set({ currentRound: nextRound }).where(eq(classes.id, classId!));

  return { success: true, nextRound, totalNewSessions: studentIds.length };
});

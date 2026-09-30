import { db } from '#server/database';
import { schedules, classes, students } from '#server/database/schema';
import { eq, and, asc } from 'drizzle-orm';
import { requireTeacher } from '#server/utils/auth';
import { getTodayDateString, getNextClassDate, recalculateDatesArray, formatShortDate } from '#server/utils/scheduler';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

const postponeSchema = z.object({
  target: z.enum(['end', 'next', 'carry_over', 'skip']).default('end'),
  reason: z.string().default('Izin / Sakit')
});

export default defineEventHandler(async (event) => {
  const teacher = requireTeacher(event);
  const classId = getRouterParam(event, 'classId');
  const scheduleId = getRouterParam(event, 'scheduleId');
  const body = await readBody(event);
  const parsed = postponeSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Parameter tunda tidak valid' });
  }

  const { target, reason } = parsed.data;

  // 1. Verify Class Ownership
  const classList = await db.select().from(classes).where(and(eq(classes.id, classId!), eq(classes.teacherId, teacher.userId)));
  if (classList.length === 0) throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  const cls = classList[0];

  // 2. Fetch all schedules of class
  const allSchedules = await db
    .select()
    .from(schedules)
    .where(eq(schedules.classId, classId!))
    .orderBy(asc(schedules.date), asc(schedules.sessionNumber));

  const targetIdx = allSchedules.findIndex(s => s.id === scheduleId);
  if (targetIdx === -1) throw createError({ statusCode: 404, statusMessage: 'Jadwal tidak ditemukan' });

  const currentItem = allSchedules[targetIdx];
  const currentRound = currentItem.round || 1;
  const today = getTodayDateString(cls.timezone);
  const dateFormatted = formatShortDate(currentItem.date);

  // Case 1: Carry-over to Next Round
  if (target === 'carry_over') {
    const nextRound = currentRound + 1;
    // Mark current item as postponed
    await db
      .update(schedules)
      .set({
        status: 'postponed',
        note: currentItem.note
          ? `${currentItem.note} | Ditunda ke Putaran #${nextRound} (${reason})`
          : `Ditunda ke Putaran #${nextRound} (${reason})`
      })
      .where(eq(schedules.id, scheduleId!));

    // Check if next round already exists
    const hasNextRound = allSchedules.some(s => (s.round || 1) === nextRound);

    if (!hasNextRound) {
      // Create Next Round with this student as #1
      const activeStudents = await db.select().from(students).where(and(eq(students.classId, classId!), eq(students.active, true))).orderBy(asc(students.orderIndex));
      const sorted = [...allSchedules].sort((a, b) => a.date.localeCompare(b.date));
      const lastDate = sorted.length > 0 ? sorted[sorted.length - 1].date : today;
      let nextDate = getNextClassDate(lastDate, cls.classDays);

      const orderedStudentIds = [
        currentItem.studentId,
        ...activeStudents.map(s => s.id).filter(id => id !== currentItem.studentId)
      ];

      for (let i = 0; i < orderedStudentIds.length; i++) {
        const sId = orderedStudentIds[i];
        const isCarry = sId === currentItem.studentId;
        await db.insert(schedules).values({
          id: `sched-${randomUUID().slice(0, 8)}`,
          classId: classId!,
          studentId: sId,
          date: nextDate,
          round: nextRound,
          sessionNumber: allSchedules.length + i + 1,
          status: 'scheduled',
          note: isCarry ? `Prioritas Pembuka Putaran #${nextRound} (Tunggakan Putaran #${currentRound})` : null,
          isCarryOver: isCarry,
          carryOverFromRound: isCarry ? currentRound : null
        });
        nextDate = getNextClassDate(nextDate, cls.classDays);
      }
    }

    return { success: true, message: `Giliran berhasil dialihkan ke Putaran #${nextRound}` };
  }

  // Case 2: Skip in this round
  if (target === 'skip') {
    await db
      .update(schedules)
      .set({
        status: 'skipped',
        note: currentItem.note
          ? `${currentItem.note} | Dilewati di Putaran #${currentRound} (${reason})`
          : `Dilewati di Putaran #${currentRound} (${reason})`
      })
      .where(eq(schedules.id, scheduleId!));

    // Recalculate remaining active items
    const remaining = allSchedules.filter(s => s.id !== scheduleId && s.status !== 'completed' && s.status !== 'skipped');
    const recalculated = recalculateDatesArray(remaining, cls.classDays, today);
    for (const item of recalculated) {
      await db.update(schedules).set({ date: item.date }).where(eq(schedules.id, item.id));
    }
    return { success: true, message: 'Sesi ditandai dilewati.' };
  }

  // Case 3: Move to end or next slot
  allSchedules.splice(targetIdx, 1);
  const noteText = reason ? `Ditunda dari ${dateFormatted} (${reason})` : `Ditunda dari ${dateFormatted}`;
  const updatedItem = {
    ...currentItem,
    status: 'postponed',
    note: currentItem.note ? `${currentItem.note} | ${noteText}` : noteText
  };

  if (target === 'next') {
    const insertIdx = Math.min(targetIdx + 1, allSchedules.length);
    allSchedules.splice(insertIdx, 0, updatedItem);
  } else {
    // End of current round
    let insertIdx = allSchedules.length;
    for (let i = allSchedules.length - 1; i >= 0; i--) {
      if ((allSchedules[i].round || 1) === currentRound) {
        insertIdx = i + 1;
        break;
      }
    }
    allSchedules.splice(insertIdx, 0, updatedItem);
  }

  const recalculated = recalculateDatesArray(allSchedules, cls.classDays, today);
  for (const item of recalculated) {
    await db
      .update(schedules)
      .set({
        date: item.date,
        status: item.status,
        note: item.note
      })
      .where(eq(schedules.id, item.id));
  }

  return { success: true, message: 'Jadwal berhasil ditunda dan dihitung ulang.' };
});

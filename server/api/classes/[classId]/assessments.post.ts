import { db } from '#server/database';
import { assessments, classes, schedules } from '#server/database/schema';
import { eq, and } from 'drizzle-orm';
import { requireTeacher } from '#server/utils/auth';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

const assessmentSchema = z.object({
  scheduleId: z.string().min(1),
  scoreFluency: z.number().min(0).max(100),
  scoreContent: z.number().min(0).max(100),
  scoreDelivery: z.number().min(0).max(100),
  scoreTime: z.number().min(0).max(100),
  durationSeconds: z.number().min(0).optional(),
  feedback: z.string().optional()
});

export default defineEventHandler(async (event) => {
  const teacher = requireTeacher(event);
  const classId = getRouterParam(event, 'classId');
  const body = await readBody(event);
  const parsed = assessmentSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Nilai evaluasi tidak valid' });
  }

  const { scheduleId, scoreFluency, scoreContent, scoreDelivery, scoreTime, durationSeconds, feedback } = parsed.data;

  // Verify class
  const classList = await db.select().from(classes).where(and(eq(classes.id, classId!), eq(classes.teacherId, teacher.userId)));
  if (classList.length === 0) throw createError({ statusCode: 403, statusMessage: 'Forbidden' });

  // Insert or update assessment
  const existing = await db.select().from(assessments).where(eq(assessments.scheduleId, scheduleId));

  if (existing.length > 0) {
    await db.update(assessments).set({
      scoreFluency,
      scoreContent,
      scoreDelivery,
      scoreTime,
      durationSeconds: durationSeconds || null,
      feedback: feedback?.trim() || null
    }).where(eq(assessments.scheduleId, scheduleId));
  } else {
    await db.insert(assessments).values({
      id: `eval-${randomUUID().slice(0, 8)}`,
      scheduleId,
      scoreFluency,
      scoreContent,
      scoreDelivery,
      scoreTime,
      durationSeconds: durationSeconds || null,
      feedback: feedback?.trim() || null
    });
  }

  // Also ensure schedule is marked completed
  await db.update(schedules).set({ status: 'completed', completedAt: new Date() }).where(eq(schedules.id, scheduleId));

  return { success: true, message: 'Penilaian berhasil disimpan dan sesi ditandai selesai!' };
});

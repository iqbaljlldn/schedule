import { db } from '#server/database';
import { schedules, classes } from '#server/database/schema';
import { eq, and } from 'drizzle-orm';
import { requireTeacher } from '#server/utils/auth';

export default defineEventHandler(async (event) => {
  const teacher = requireTeacher(event);
  const classId = getRouterParam(event, 'classId');
  const scheduleId = getRouterParam(event, 'scheduleId');

  const classList = await db.select().from(classes).where(and(eq(classes.id, classId!), eq(classes.teacherId, teacher.userId)));
  if (classList.length === 0) throw createError({ statusCode: 403, statusMessage: 'Forbidden' });

  const updated = await db
    .update(schedules)
    .set({
      status: 'scheduled',
      completedAt: null
    })
    .where(and(eq(schedules.id, scheduleId!), eq(schedules.classId, classId!)))
    .returning();

  return { success: true, schedule: updated[0] };
});

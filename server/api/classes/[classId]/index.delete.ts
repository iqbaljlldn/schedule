import { db } from '#server/database';
import { classes, students, schedules, assessments } from '#server/database/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireTeacher } from '#server/utils/auth';

export default defineEventHandler(async (event) => {
  const teacher = requireTeacher(event);
  const classId = getRouterParam(event, 'classId');

  // Verify class belongs to this teacher
  const classList = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId!), eq(classes.teacherId, teacher.userId)));

  if (classList.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Kelas tidak ditemukan atau Anda tidak berhak menghapusnya.' });
  }

  // 1. Find all schedule IDs for this class
  const classSchedules = await db
    .select({ id: schedules.id })
    .from(schedules)
    .where(eq(schedules.classId, classId!));

  const scheduleIds = classSchedules.map(s => s.id);

  // 2. Delete assessments
  if (scheduleIds.length > 0) {
    await db.delete(assessments).where(inArray(assessments.scheduleId, scheduleIds));
  }

  // 3. Delete schedules
  await db.delete(schedules).where(eq(schedules.classId, classId!));

  // 4. Delete students
  await db.delete(students).where(eq(students.classId, classId!));

  // 5. Delete class
  await db.delete(classes).where(eq(classes.id, classId!));

  return { success: true, message: 'Kelas berhasil dihapus.' };
});

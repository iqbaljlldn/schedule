import { db } from '#server/database';
import { classes, students, schedules } from '#server/database/schema';
import { eq } from 'drizzle-orm';
import { requireTeacher } from '#server/utils/auth';

export default defineEventHandler(async (event) => {
  const teacher = requireTeacher(event);

  const teacherClasses = await db
    .select()
    .from(classes)
    .where(eq(classes.teacherId, teacher.userId));

  // Get student and session counts per class
  const classSummaries = await Promise.all(
    teacherClasses.map(async (cls) => {
      const classStudents = await db.select().from(students).where(eq(students.classId, cls.id));
      const classSchedules = await db.select().from(schedules).where(eq(schedules.classId, cls.id));

      return {
        ...cls,
        studentCount: classStudents.filter(s => s.active).length,
        scheduleCount: classSchedules.length,
        completedCount: classSchedules.filter(s => s.status === 'completed').length
      };
    })
  );

  return { classes: classSummaries };
});

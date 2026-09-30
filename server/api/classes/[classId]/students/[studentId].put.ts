import { db } from '#server/database';
import { students, classes, schedules } from '#server/database/schema';
import { eq, and, ne } from 'drizzle-orm';
import { requireTeacher } from '#server/utils/auth';
import { z } from 'zod';

const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  studentNumber: z.string().optional(),
  active: z.boolean().optional()
});

export default defineEventHandler(async (event) => {
  const teacher = requireTeacher(event);
  const classId = getRouterParam(event, 'classId');
  const studentId = getRouterParam(event, 'studentId');
  const body = await readBody(event);
  const parsed = updateStudentSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Data tidak valid' });
  }

  // Verify class
  const classList = await db.select().from(classes).where(and(eq(classes.id, classId!), eq(classes.teacherId, teacher.userId)));
  if (classList.length === 0) throw createError({ statusCode: 403, statusMessage: 'Forbidden' });

  const updated = await db
    .update(students)
    .set({
      name: parsed.data.name?.trim(),
      studentNumber: parsed.data.studentNumber,
      active: parsed.data.active
    })
    .where(and(eq(students.id, studentId!), eq(students.classId, classId!)))
    .returning();

  // If archived (active = false), delete only future uncompleted schedules
  if (parsed.data.active === false) {
    await db
      .delete(schedules)
      .where(and(eq(schedules.studentId, studentId!), eq(schedules.classId, classId!), ne(schedules.status, 'completed')));
  }

  return { success: true, student: updated[0] };
});

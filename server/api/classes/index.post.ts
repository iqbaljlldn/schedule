import { db } from '#server/database';
import { classes, students, schedules } from '#server/database/schema';
import { requireTeacher } from '#server/utils/auth';
import { getFirstClassDateOnOrAfter, getNextClassDate } from '#server/utils/scheduler';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

const createClassSchema = z.object({
  name: z.string().min(2, 'Nama kelas minimal 2 karakter'),
  slug: z.string().min(2, 'Slug minimal 2 karakter').regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  classDays: z.array(z.number().int().min(0).max(6)).min(1, 'Minimal pilih 1 hari aktif kelas'),
  timezone: z.string().default('Asia/Jakarta'),
  studentNames: z.array(z.string()).optional()
});

export default defineEventHandler(async (event) => {
  const teacher = requireTeacher(event);
  const body = await readBody(event);
  const parsed = createClassSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Input tidak valid'
    });
  }

  const { name, slug, startDate, classDays, timezone, studentNames } = parsed.data;

  // Insert class
  const classId = `class-${randomUUID().slice(0, 8)}`;
  try {
    const insertedClass = await db.insert(classes).values({
      id: classId,
      teacherId: teacher.userId,
      name,
      slug,
      startDate,
      classDays,
      timezone,
      currentRound: 1
    }).returning();

    // If students provided, insert them and create initial schedule
    if (studentNames && studentNames.length > 0) {
      let currDate = getFirstClassDateOnOrAfter(startDate, classDays);
      for (let i = 0; i < studentNames.length; i++) {
        const studentId = `student-${randomUUID().slice(0, 8)}`;
        const sName = studentNames[i].trim();
        if (!sName) continue;

        await db.insert(students).values({
          id: studentId,
          classId,
          name: sName,
          orderIndex: i,
          active: true
        });

        await db.insert(schedules).values({
          id: `sched-${randomUUID().slice(0, 8)}`,
          classId,
          studentId,
          date: currDate,
          round: 1,
          sessionNumber: i + 1,
          status: 'scheduled'
        });

        currDate = getNextClassDate(currDate, classDays);
      }
    }

    return { success: true, class: insertedClass[0] };
  } catch (err: any) {
    if (err.code === '23505') {
      throw createError({ statusCode: 400, statusMessage: 'Slug kelas ini sudah dipakai, gunakan slug lain.' });
    }
    throw err;
  }
});

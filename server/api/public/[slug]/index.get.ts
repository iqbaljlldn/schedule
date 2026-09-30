import { db } from '#server/database';
import { classes, students, schedules, assessments } from '#server/database/schema';
import { eq, asc } from 'drizzle-orm';
import { getTodayDateString, getRelativeDateInfo } from '#server/utils/scheduler';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug kelas diperlukan' });
  }

  // 1. Fetch Class
  const classList = await db.select().from(classes).where(eq(classes.slug, slug));
  if (classList.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Kelas tidak ditemukan' });
  }
  const cls = classList[0];

  // 2. Fetch Students
  const studentList = await db.select().from(students).where(eq(students.classId, cls.id));
  const studentMap = new Map(studentList.map(s => [s.id, s]));

  // 3. Fetch Schedules
  const scheduleList = await db
    .select()
    .from(schedules)
    .where(eq(schedules.classId, cls.id))
    .orderBy(asc(schedules.date), asc(schedules.sessionNumber));

  // 4. Attach Student Details and Relative Dates
  const today = getTodayDateString(cls.timezone);
  const populatedSchedules = scheduleList.map((item, idx) => {
    const student = studentMap.get(item.studentId) || { id: item.studentId, name: 'Siswa Tidak Dikenal', active: false };
    return {
      ...item,
      sessionNumber: item.sessionNumber || idx + 1,
      student,
      relativeDate: getRelativeDateInfo(item.date, today)
    };
  });

  // 5. Separate Today, Upcoming, and Past
  const todayEntry = populatedSchedules.find(s => s.date === today) || null;
  const upcomingEntries = populatedSchedules.filter(s => s.date > today);
  const pastEntries = populatedSchedules
    .filter(s => s.status === 'completed' || s.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    class: {
      id: cls.id,
      name: cls.name,
      slug: cls.slug,
      timezone: cls.timezone,
      currentRound: cls.currentRound,
      requiresPasscode: Boolean(cls.passcode)
    },
    todayDate: today,
    todayEntry,
    upcomingEntries: upcomingEntries.slice(0, 10),
    pastEntries: pastEntries.slice(0, 6),
    fullSchedule: populatedSchedules,
    stats: {
      totalStudents: studentList.filter(s => s.active).length,
      totalSessions: populatedSchedules.length,
      completedCount: populatedSchedules.filter(s => s.status === 'completed').length,
      scheduledCount: populatedSchedules.filter(s => s.status === 'scheduled').length,
      postponedCount: populatedSchedules.filter(s => s.status === 'postponed').length
    }
  };
});

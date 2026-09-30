import { db } from '#server/database';
import { classes, students, schedules, assessments } from '#server/database/schema';
import { eq, and, asc } from 'drizzle-orm';
import { requireTeacher } from '#server/utils/auth';
import { getTodayDateString, getRelativeDateInfo } from '#server/utils/scheduler';

export default defineEventHandler(async (event) => {
  const teacher = requireTeacher(event);
  const classId = getRouterParam(event, 'classId');

  const classList = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId!), eq(classes.teacherId, teacher.userId)));

  if (classList.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Kelas tidak ditemukan atau Anda tidak memiliki akses.' });
  }
  const cls = classList[0];

  const studentList = await db
    .select()
    .from(students)
    .where(eq(students.classId, cls.id))
    .orderBy(asc(students.orderIndex));
  const studentMap = new Map(studentList.map(s => [s.id, s]));

  const scheduleList = await db
    .select()
    .from(schedules)
    .where(eq(schedules.classId, cls.id))
    .orderBy(asc(schedules.date), asc(schedules.sessionNumber));

  const assessmentList = await db.select().from(assessments);
  const assessmentMap = new Map(assessmentList.map(a => [a.scheduleId, a]));

  const today = getTodayDateString(cls.timezone);
  const populatedSchedules = scheduleList.map((item, idx) => {
    const student = studentMap.get(item.studentId) || { id: item.studentId, name: 'Siswa Tidak Dikenal', active: false };
    const assessment = assessmentMap.get(item.id) || null;
    return {
      ...item,
      sessionNumber: item.sessionNumber || idx + 1,
      student,
      assessment,
      relativeDate: getRelativeDateInfo(item.date, today)
    };
  });

  const todayEntry = populatedSchedules.find(s => s.date === today) || null;
  const upcomingEntries = populatedSchedules.filter(s => s.date > today);
  const pastEntries = populatedSchedules
    .filter(s => s.status === 'completed' || s.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalRounds = scheduleList.reduce((max, s) => Math.max(max, s.round || 1), 1);

  return {
    class: cls,
    todayDate: today,
    todayEntry,
    upcomingEntries,
    pastEntries,
    fullSchedule: populatedSchedules,
    students: studentList,
    stats: {
      totalStudents: studentList.filter(s => s.active).length,
      totalSessions: populatedSchedules.length,
      completedCount: populatedSchedules.filter(s => s.status === 'completed').length,
      scheduledCount: populatedSchedules.filter(s => s.status === 'scheduled').length,
      postponedCount: populatedSchedules.filter(s => s.status === 'postponed').length,
      currentRound: cls.currentRound,
      totalRounds
    }
  };
});

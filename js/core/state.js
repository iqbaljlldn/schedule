/**
 * Initial state definitions and Demo Data generation.
 */

export function createEmptyState() {
  return {
    version: 1,
    class: {
      name: '',
      startDate: '',
      classDays: [1, 2, 3, 4, 5],
      timezone: 'Asia/Jakarta'
    },
    students: [],
    schedule: []
  };
}

export function createDemoState() {
  const students = [
    { id: 'student-1', name: 'Alice Prasetyo', active: true },
    { id: 'student-2', name: 'Budi Santoso', active: true },
    { id: 'student-3', name: 'Cindy Claudia', active: true },
    { id: 'student-4', name: 'Dimas Ramadhan', active: true },
    { id: 'student-5', name: 'Eka Putri', active: true },
    { id: 'student-6', name: 'Fajar Hidayat', active: true },
    { id: 'student-7', name: 'Gita Savitri', active: true },
    { id: 'student-8', name: 'Hendra Wijaya', active: true },
    { id: 'student-9', name: 'Indah Permata', active: true },
    { id: 'student-10', name: 'Joko Anwar', active: true },
    { id: 'student-11', name: 'Kevin Sanjaya', active: true },
    { id: 'student-12', name: 'Lina Marlina', active: true }
  ];

  // Schedule spanning past, today (2026-09-30), and upcoming class days
  const schedule = [
    {
      id: 'schedule-1',
      studentId: 'student-1',
      date: '2026-09-28',
      status: 'completed',
      completedAt: '2026-09-28T10:15:00.000Z',
      note: 'Topik: Arsitektur Microservices & Event Bus'
    },
    {
      id: 'schedule-2',
      studentId: 'student-2',
      date: '2026-09-29',
      status: 'completed',
      completedAt: '2026-09-29T10:20:00.000Z',
      note: 'Topik: Strategi Optimasi Index Database PostgreSQL'
    },
    {
      id: 'schedule-3',
      studentId: 'student-3',
      date: '2026-09-30',
      status: 'scheduled',
      completedAt: null,
      note: 'Topik: High-Throughput Message Queue dengan Apache Kafka'
    },
    {
      id: 'schedule-4',
      studentId: 'student-4',
      date: '2026-10-01',
      status: 'scheduled',
      completedAt: null,
      note: null
    },
    {
      id: 'schedule-5',
      studentId: 'student-5',
      date: '2026-10-02',
      status: 'scheduled',
      completedAt: null,
      note: null
    },
    {
      id: 'schedule-6',
      studentId: 'student-6',
      date: '2026-10-05',
      status: 'scheduled',
      completedAt: null,
      note: null
    },
    {
      id: 'schedule-7',
      studentId: 'student-7',
      date: '2026-10-06',
      status: 'scheduled',
      completedAt: null,
      note: null
    },
    {
      id: 'schedule-8',
      studentId: 'student-8',
      date: '2026-10-07',
      status: 'scheduled',
      completedAt: null,
      note: null
    },
    {
      id: 'schedule-9',
      studentId: 'student-9',
      date: '2026-10-08',
      status: 'scheduled',
      completedAt: null,
      note: null
    },
    {
      id: 'schedule-10',
      studentId: 'student-10',
      date: '2026-10-09',
      status: 'scheduled',
      completedAt: null,
      note: null
    },
    {
      id: 'schedule-11',
      studentId: 'student-11',
      date: '2026-10-12',
      status: 'scheduled',
      completedAt: null,
      note: null
    },
    {
      id: 'schedule-12',
      studentId: 'student-12',
      date: '2026-10-13',
      status: 'scheduled',
      completedAt: null,
      note: null
    }
  ];

  return {
    version: 1,
    class: {
      name: 'Backend Engineering Batch #4',
      startDate: '2026-09-28',
      classDays: [1, 2, 3, 4, 5], // Monday - Friday
      timezone: 'Asia/Jakarta'
    },
    students,
    schedule
  };
}

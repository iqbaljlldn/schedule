/**
 * Initial state definitions and Real Classroom Data.
 */

export const REAL_STUDENT_NAMES = [
  'AHMAD YAZID',
  'MUHAMMAD DEDY',
  'MUHAMMAD ZAKY KAMILURRIZAL',
  'HANIF ABDURRAHMAN ARRIFAI',
  'MUHAMAD FARIZ ASH SYUHADA',
  'AHMAD MAULANA',
  'REYNALDI ABDITIO',
  'MUHAMMAD HAIDAR ALI',
  'ABDULLAH MUFID AD\'DIEWA',
  'MUHAMAD NIZZAR RAMADHAN',
  'GUSTI DIMAS ACHMAD',
  'MUHAMMAD ARIEF SYAM',
  'ILLIYIN AURO',
  'ALIFFUDDIN ADILLA RAFIF',
  'HUSAIN FADHILAH AMAL',
  'MUHAMMAD FAIZZUDIN AMRULLOH',
  'MUHAMMAD YUSUF ALI RAHMAN',
  'ABID LUQMAN'
];

export function createEmptyState() {
  return {
    version: 2,
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
  const students = REAL_STUDENT_NAMES.map((name, idx) => ({
    id: `student-${idx + 1}`,
    name,
    active: true
  }));

  // Sequential class dates starting 1 Oktober 2026 (skipping weekends Saturday=3, Sunday=4)
  const scheduledDates = [
    '2026-10-01', // Kamis - AHMAD YAZID
    '2026-10-02', // Jumat - MUHAMMAD DEDY
    '2026-10-05', // Senin - MUHAMMAD ZAKY KAMILURRIZAL
    '2026-10-06', // Selasa - HANIF ABDURRAHMAN ARRIFAI
    '2026-10-07', // Rabu - MUHAMAD FARIZ ASH SYUHADA
    '2026-10-08', // Kamis - AHMAD MAULANA
    '2026-10-09', // Jumat - REYNALDI ABDITIO
    '2026-10-12', // Senin - MUHAMMAD HAIDAR ALI
    '2026-10-13', // Selasa - ABDULLAH MUFID AD'DIEWA
    '2026-10-14', // Rabu - MUHAMAD NIZZAR RAMADHAN
    '2026-10-15', // Kamis - GUSTI DIMAS ACHMAD
    '2026-10-16', // Jumat - MUHAMMAD ARIEF SYAM
    '2026-10-19', // Senin - ILLIYIN AURO
    '2026-10-20', // Selasa - ALIFFUDDIN ADILLA RAFIF
    '2026-10-21', // Rabu - HUSAIN FADHILAH AMAL
    '2026-10-22', // Kamis - MUHAMMAD FAIZZUDIN AMRULLOH
    '2026-10-23', // Jumat - MUHAMMAD YUSUF ALI RAHMAN
    '2026-10-26'  // Senin - ABID LUQMAN
  ];

  const schedule = students.map((student, idx) => ({
    id: `schedule-${idx + 1}`,
    studentId: student.id,
    date: scheduledDates[idx],
    round: 1,
    status: 'scheduled',
    completedAt: null,
    note: null,
    isCarryOver: false,
    carryOverFromRound: null
  }));

  return {
    version: 2,
    class: {
      name: 'Motivational Show Class',
      startDate: '2026-10-01',
      classDays: [1, 2, 3, 4, 5], // Monday - Friday
      timezone: 'Asia/Jakarta'
    },
    students,
    schedule
  };
}

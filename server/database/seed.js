import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_p2P5zGTYAkqv@ep-morning-firefly-a1u1rq3i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const sql = postgres(connectionString, { prepare: false });

const REAL_STUDENTS = [
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

const SCHEDULE_DATES = [
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

async function seed() {
  console.log('Seeding PostgreSQL database on Neon...');

  // 1. Seed Teacher Account
  const passwordHash = bcrypt.hashSync('password123', 10);
  const teacherId = 'teacher-1';
  await sql`
    INSERT INTO users (id, email, password_hash, name, role)
    VALUES (${teacherId}, 'guru@sekolah.id', ${passwordHash}, 'Ustadz Pembimbing', 'teacher')
    ON CONFLICT (email) DO UPDATE
    SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash;
  `;
  console.log('✓ Teacher account ready: guru@sekolah.id (password: password123)');

  // 2. Seed Class
  const classId = 'class-1';
  const slug = 'public-speaking-2026';
  await sql`
    INSERT INTO classes (id, teacher_id, name, slug, passcode, class_days, start_date, timezone, current_round)
    VALUES (
      ${classId},
      ${teacherId},
      'Motivational Show Class',
      ${slug},
      null,
      ${JSON.stringify([1, 2, 3, 4, 5])}::jsonb,
      '2026-10-01',
      'Asia/Jakarta',
      1
    )
    ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name, start_date = EXCLUDED.start_date;
  `;
  console.log(`✓ Class ready: Motivational Show Class (Slug: /c/${slug})`);

  // 3. Clear existing students and schedules for this class to ensure clean 18 students
  await sql`DELETE FROM schedules WHERE class_id = ${classId};`;
  await sql`DELETE FROM students WHERE class_id = ${classId};`;

  // 4. Insert 18 Real Students
  for (let i = 0; i < REAL_STUDENTS.length; i++) {
    const studentId = `student-${i + 1}`;
    const name = REAL_STUDENTS[i];
    await sql`
      INSERT INTO students (id, class_id, name, order_index, active)
      VALUES (${studentId}, ${classId}, ${name}, ${i}, true);
    `;

    // 5. Insert Schedule for Round 1
    const scheduleId = `sched-${i + 1}`;
    const date = SCHEDULE_DATES[i];
    await sql`
      INSERT INTO schedules (
        id, class_id, student_id, date, round, session_number, status, note, topic_title, is_carry_over
      )
      VALUES (
        ${scheduleId},
        ${classId},
        ${studentId},
        ${date},
        1,
        ${i + 1},
        'scheduled',
        null,
        null,
        false
      );
    `;
  }

  console.log(`✓ Inserted ${REAL_STUDENTS.length} students and schedules starting 2026-10-01.`);
  console.log('Database seeding completed successfully! 🎉');
  await sql.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});

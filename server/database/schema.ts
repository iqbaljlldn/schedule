import { pgTable, varchar, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Teachers & Admins Table
 */
export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('teacher').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

/**
 * Classes Table (Multi-tenant: Owned by a teacher)
 */
export const classes = pgTable('classes', {
  id: varchar('id', { length: 64 }).primaryKey(),
  teacherId: varchar('teacher_id', { length: 64 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  passcode: varchar('passcode', { length: 50 }),
  classDays: jsonb('class_days').$type<number[]>().notNull(),
  startDate: varchar('start_date', { length: 10 }).notNull(),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Jakarta').notNull(),
  currentRound: integer('current_round').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

/**
 * Students Table
 */
export const students = pgTable('students', {
  id: varchar('id', { length: 64 }).primaryKey(),
  classId: varchar('class_id', { length: 64 }).references(() => classes.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  studentNumber: varchar('student_number', { length: 50 }),
  active: boolean('active').default(true).notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

/**
 * Schedules Table (Dynamic Ordered Queue)
 */
export const schedules = pgTable('schedules', {
  id: varchar('id', { length: 64 }).primaryKey(),
  classId: varchar('class_id', { length: 64 }).references(() => classes.id, { onDelete: 'cascade' }).notNull(),
  studentId: varchar('student_id', { length: 64 }).references(() => students.id, { onDelete: 'cascade' }).notNull(),
  date: varchar('date', { length: 10 }).notNull(), // ISO YYYY-MM-DD
  round: integer('round').default(1).notNull(),
  sessionNumber: integer('session_number').default(1).notNull(),
  status: varchar('status', { length: 50 }).default('scheduled').notNull(), // 'scheduled' | 'completed' | 'postponed' | 'skipped'
  note: text('note'),
  topicTitle: varchar('topic_title', { length: 255 }),
  isCarryOver: boolean('is_carry_over').default(false).notNull(),
  carryOverFromRound: integer('carry_over_from_round'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

/**
 * Live Assessments / Scoring Rubric Table
 */
export const assessments = pgTable('assessments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  scheduleId: varchar('schedule_id', { length: 64 }).references(() => schedules.id, { onDelete: 'cascade' }).notNull().unique(),
  scoreFluency: integer('score_fluency'),
  scoreContent: integer('score_content'),
  scoreDelivery: integer('score_delivery'),
  scoreTime: integer('score_time'),
  durationSeconds: integer('duration_seconds'),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  classes: many(classes)
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id]
  }),
  students: many(students),
  schedules: many(schedules)
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  class: one(classes, {
    fields: [students.classId],
    references: [classes.id]
  }),
  schedules: many(schedules)
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  class: one(classes, {
    fields: [schedules.classId],
    references: [classes.id]
  }),
  student: one(students, {
    fields: [schedules.studentId],
    references: [students.id]
  }),
  assessment: one(assessments, {
    fields: [schedules.id],
    references: [assessments.scheduleId]
  })
}));

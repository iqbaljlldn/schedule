import { db } from '#server/database';
import { users } from '#server/database/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, createToken } from '#server/utils/auth';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter')
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Input tidak valid'
    });
  }

  const { name, email, password } = parsed.data;
  const cleanEmail = email.toLowerCase().trim();

  // Check if email already registered
  const existing = await db.select().from(users).where(eq(users.email, cleanEmail));
  if (existing.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email ini sudah terdaftar. Silakan langsung masuk.'
    });
  }

  const passwordHash = await hashPassword(password);
  const userId = `teacher-${randomUUID().slice(0, 8)}`;

  await db.insert(users).values({
    id: userId,
    email: cleanEmail,
    passwordHash,
    name: name.trim(),
    role: 'teacher'
  });

  const payload = {
    userId,
    email: cleanEmail,
    name: name.trim(),
    role: 'teacher'
  };

  const token = createToken(payload);

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });

  return {
    success: true,
    user: payload
  };
});

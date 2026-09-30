import { db } from '#server/database';
import { users } from '#server/database/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, createToken } from '#server/utils/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter')
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Input tidak valid'
    });
  }

  const { email, password } = parsed.data;
  const userList = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));

  if (userList.length === 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Email atau password salah.'
    });
  }

  const user = userList[0];
  const isMatch = await verifyPassword(password, user.passwordHash);

  if (!isMatch) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Email atau password salah.'
    });
  }

  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role
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

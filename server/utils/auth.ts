import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { H3Event } from 'h3';

const JWT_SECRET = process.env.JWT_SECRET || 'public-speaking-tracker-super-secret-jwt-key-2026';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export function createToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export function getUserSession(event: H3Event): UserSession | null {
  // Check cookie first
  const cookie = getCookie(event, 'auth_token');
  if (cookie) {
    const user = verifyToken(cookie);
    if (user) return user;
  }

  // Check Authorization header
  const authHeader = getHeader(event, 'Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return verifyToken(token);
  }

  return null;
}

export function requireTeacher(event: H3Event): UserSession {
  const session = getUserSession(event);
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Silakan login sebagai guru terlebih dahulu.'
    });
  }
  return session;
}

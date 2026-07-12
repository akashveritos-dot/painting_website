import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { dbQuery } from './db';

// Fail fast rather than fall back to a public default — a guessable secret means
// anyone can forge a valid session (including an ADMIN one). Shared by the auth routes.
export const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters. Refusing to start with an insecure default.');
  }
  return secret;
})();

export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

/**
 * Parses and validates the JWT from secure cookies.
 * Fetches user profile data from MySQL without any ORM.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    // Verify JWT integrity
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    if (!decoded || !decoded.userId) {
      return null;
    }

    // Run direct query to fetch the user metadata
    const sql = 'SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1';
    const users = await dbQuery(sql, [decoded.userId]);

    if (!users || users.length === 0) {
      return null;
    }

    return {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email,
      role: users[0].role,
    };
  } catch (error) {
    console.error('Error fetching session user:', error);
    return null;
  }
}

/**
 * Checks if the current session belongs to an Admin.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  return user?.role === 'ADMIN';
}

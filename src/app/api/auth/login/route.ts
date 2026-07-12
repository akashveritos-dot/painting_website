import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbQuery } from '@/lib/db';
import { JWT_SECRET } from '@/lib/auth-server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Retrieve user from DB
    const sql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    const users = await dbQuery(sql, [email]);

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Check password match
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Set secure HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Write login session in sessions table (optional but good practice)
    const sessionId = crypto.randomUUID();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    const sessionSql = 'INSERT INTO sessions (id, session_token, user_id, expires) VALUES (?, ?, ?, ?)';
    await dbQuery(sessionSql, [sessionId, token, user.id, expiry]);

    // Log login activity
    const logSql = 'INSERT INTO activity_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)';
    await dbQuery(logSql, [
      crypto.randomUUID(),
      user.id,
      'USER_LOGIN',
      `User ${email} logged in successfully.`
    ]);

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during sign-in. Please try again.' },
      { status: 500 }
    );
  }
}

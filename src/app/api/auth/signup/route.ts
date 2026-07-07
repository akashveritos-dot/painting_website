import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Input Validation
    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Invalid email or password (min 6 characters)' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const checkSql = 'SELECT id FROM users WHERE email = ? LIMIT 1';
    const existing = await dbQuery(checkSql, [email]);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();

    // Insert user into MySQL. Default role is 'CUSTOMER'
    // To set an admin, we can modify the role in the database or seed it
    const insertSql = 'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)';
    await dbQuery(insertSql, [userId, name || null, email, hashedPassword, 'CUSTOMER']);

    // Log registration action
    const logSql = 'INSERT INTO activity_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)';
    await dbQuery(logSql, [
      crypto.randomUUID(),
      userId,
      'USER_SIGNUP',
      `User ${email} signed up successfully.`
    ]);

    return NextResponse.json(
      { message: 'User registered successfully', userId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}

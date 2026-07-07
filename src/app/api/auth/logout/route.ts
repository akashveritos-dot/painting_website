import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { dbQuery } from '@/lib/db';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (token) {
      // Remove session from the DB
      const sessionSql = 'DELETE FROM sessions WHERE session_token = ?';
      await dbQuery(sessionSql, [token]);
    }

    // Clear the auth cookie
    cookieStore.delete('auth_token');

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout. Please try again.' },
      { status: 500 }
    );
  }
}

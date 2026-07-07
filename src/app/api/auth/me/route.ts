import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Fetch user session failed:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve active session' },
      { status: 500 }
    );
  }
}

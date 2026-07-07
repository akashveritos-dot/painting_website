import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { dbQuery } from '@/lib/db';

interface ContactRow {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'REPLIED';
  createdAt: string;
}

export async function GET() {
  const user = await getSessionUser();
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const requests = await dbQuery<ContactRow[]>(
      `SELECT id, name, email, message, status, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
       FROM contact_requests
       ORDER BY created_at DESC`
    );
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Contact request fetch failed:', error);
    return NextResponse.json({ error: 'Failed to load contact requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    await dbQuery(
      'INSERT INTO contact_requests (id, name, email, message, status) VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), body.name, body.email, body.message, 'UNREAD']
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Contact request save failed:', error);
    return NextResponse.json({ error: 'Failed to submit contact request' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    await dbQuery('UPDATE contact_requests SET status = ? WHERE id = ?', [body.status, body.id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Contact request update failed:', error);
    return NextResponse.json({ error: 'Failed to update contact request' }, { status: 500 });
  }
}

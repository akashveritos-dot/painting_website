import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { dbQuery } from '@/lib/db';

interface AddressRow {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  isDefault: number | boolean;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ addresses: [] }, { status: 401 });
  }

  try {
    const rows = await dbQuery<AddressRow[]>(
      `SELECT id, user_id AS userId, full_name AS fullName, email, address, city, state, zip, is_default AS isDefault
       FROM saved_addresses
       WHERE user_id = ?
       ORDER BY is_default DESC, updated_at DESC`,
      [user.id]
    );

    return NextResponse.json({
      addresses: rows.map((row) => ({ ...row, isDefault: !!row.isDefault })),
    });
  } catch (error) {
    console.error('Address fetch failed:', error);
    return NextResponse.json({ error: 'Failed to load saved addresses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to save addresses' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.fullName || !body.email || !body.address || !body.city || !body.state || !body.zip) {
      return NextResponse.json({ error: 'All address fields are required' }, { status: 400 });
    }

    // Only reuse a client-supplied id if it belongs to this user; otherwise a caller
    // could overwrite another user's saved address (the PK is the id, not the user).
    let id = crypto.randomUUID();
    if (body.id) {
      const owner = await dbQuery<Array<{ user_id: string }>>(
        'SELECT user_id FROM saved_addresses WHERE id = ? LIMIT 1',
        [body.id]
      );
      if (owner.length > 0 && owner[0].user_id !== user.id) {
        return NextResponse.json({ error: 'Address not found' }, { status: 404 });
      }
      id = body.id;
    }

    if (body.isDefault !== false) {
      await dbQuery('UPDATE saved_addresses SET is_default = ? WHERE user_id = ?', [0, user.id]);
    }

    await dbQuery(
      `INSERT INTO saved_addresses (id, user_id, full_name, email, address, city, state, zip, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        email = VALUES(email),
        address = VALUES(address),
        city = VALUES(city),
        state = VALUES(state),
        zip = VALUES(zip),
        is_default = VALUES(is_default)`,
      [
        id,
        user.id,
        body.fullName,
        body.email,
        body.address,
        body.city,
        body.state,
        body.zip,
        body.isDefault === false ? 0 : 1,
      ]
    );

    return NextResponse.json({ address: { id, ...body, isDefault: body.isDefault !== false } });
  } catch (error) {
    console.error('Address save failed:', error);
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Address id is required' }, { status: 400 });
    }

    // Scoped to user_id so a caller can only delete their own address.
    await dbQuery('DELETE FROM saved_addresses WHERE id = ? AND user_id = ?', [id, user.id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Address delete failed:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}

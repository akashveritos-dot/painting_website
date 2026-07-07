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

async function ensureSavedAddressesTable() {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS saved_addresses (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      city VARCHAR(120) NOT NULL,
      state VARCHAR(120) NOT NULL,
      zip VARCHAR(30) NOT NULL,
      is_default BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_saved_address_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ addresses: [] }, { status: 401 });
  }

  try {
    await ensureSavedAddressesTable();
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
    await ensureSavedAddressesTable();

    if (body.isDefault !== false) {
      await dbQuery('UPDATE saved_addresses SET is_default = ? WHERE user_id = ?', [0, user.id]);
    }

    const id = body.id || crypto.randomUUID();
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

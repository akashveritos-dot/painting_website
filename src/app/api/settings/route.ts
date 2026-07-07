import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { isAdmin } from '@/lib/auth-server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// GET: Fetch settings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      const sql = 'SELECT setting_value AS value FROM website_settings WHERE setting_key = ? LIMIT 1';
      const results = await dbQuery(sql, [key]);
      return NextResponse.json({ value: results && results.length > 0 ? results[0].value : null });
    }

    const sql = 'SELECT setting_key AS `key`, setting_value AS `value` FROM website_settings';
    const settings = await dbQuery(sql);
    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to retrieve settings' }, { status: 500 });
  }
}

// POST: Update settings (Admin protected)
export async function POST(request: Request) {
  try {
    const isAuthorized = await isAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key, value } = await request.json();
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO website_settings (id, setting_key, setting_value) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE setting_value = ?
    `;
    await dbQuery(sql, [id, key, value, value]);

    return NextResponse.json({ message: `Setting ${key} updated successfully` });
  } catch (error: any) {
    console.error('Error saving setting:', error);
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
  }
}

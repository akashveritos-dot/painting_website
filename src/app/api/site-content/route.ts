import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { isAdmin } from '@/lib/auth-server';
import { DEFAULT_HOME_CONTENT, HOME_CONTENT_KEY, normalizeHomeContent } from '@/lib/site-content';

interface WebsiteSettingRow {
  setting_value: string;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await dbQuery<WebsiteSettingRow[]>(
      'SELECT setting_value FROM website_settings WHERE setting_key = ? LIMIT 1',
      [HOME_CONTENT_KEY]
    );

    if (!rows[0]?.setting_value) {
      return NextResponse.json({ home: DEFAULT_HOME_CONTENT });
    }

    return NextResponse.json({
      home: normalizeHomeContent(JSON.parse(rows[0].setting_value)),
    });
  } catch (error) {
    console.warn('Site content query failed, using defaults:', error);
    return NextResponse.json({ home: DEFAULT_HOME_CONTENT });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const home = normalizeHomeContent(body?.home);
    const value = JSON.stringify(home);

    await dbQuery(
      `INSERT INTO website_settings (id, setting_key, setting_value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [crypto.randomUUID(), HOME_CONTENT_KEY, value]
    );

    return NextResponse.json({ home });
  } catch (error) {
    console.error('Site content save failed:', error);
    return NextResponse.json({ error: 'Failed to save site content' }, { status: 500 });
  }
}

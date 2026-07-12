import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { isAdmin } from '@/lib/auth-server';
import { DEFAULT_PRICING_CONFIG, normalizePricingConfig } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

const KEY = 'pricing_config';

// GET: public — cart/checkout read this to display the same tax/shipping the server charges.
export async function GET() {
  try {
    const rows = await dbQuery<Array<{ value: string }>>(
      'SELECT setting_value AS value FROM website_settings WHERE setting_key = ? LIMIT 1',
      [KEY]
    );
    if (!rows[0]?.value) {
      return NextResponse.json({ config: DEFAULT_PRICING_CONFIG });
    }
    return NextResponse.json({ config: normalizePricingConfig(JSON.parse(rows[0].value)) });
  } catch (error) {
    console.warn('Pricing config read failed, using defaults:', error);
    return NextResponse.json({ config: DEFAULT_PRICING_CONFIG });
  }
}

// PUT: admin — save tax/shipping rules. Values are normalized/clamped server-side.
export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const config = normalizePricingConfig(body.config ?? body);
    await dbQuery(
      `INSERT INTO website_settings (id, setting_key, setting_value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [crypto.randomUUID(), KEY, JSON.stringify(config)]
    );
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Pricing config save failed:', error);
    return NextResponse.json({ error: 'Failed to save pricing settings' }, { status: 500 });
  }
}

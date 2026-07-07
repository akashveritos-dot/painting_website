import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { isAdmin } from '@/lib/auth-server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// GET: Validate a coupon by code, or list all (Admin only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.trim().toUpperCase();

    if (code) {
      // Validate coupon
      const sql = `
        SELECT 
          id, code, discount_type AS discountType, 
          CAST(discount_value AS DOUBLE) AS discountValue, 
          CAST(min_order_amount AS DOUBLE) AS minOrderAmount, 
          expiry_date AS expiryDate, active 
        FROM coupons 
        WHERE code = ? LIMIT 1
      `;
      const results = await dbQuery<any[]>(sql, [code]);

      if (!results || results.length === 0) {
        return NextResponse.json({ valid: false, error: 'Coupon code does not exist.' }, { status: 404 });
      }

      const coupon = results[0];
      if (!coupon.active) {
        return NextResponse.json({ valid: false, error: 'This coupon is no longer active.' }, { status: 400 });
      }

      const expiry = new Date(coupon.expiryDate);
      if (expiry < new Date()) {
        return NextResponse.json({ valid: false, error: 'This coupon has expired.' }, { status: 400 });
      }

      return NextResponse.json({ valid: true, coupon });
    }

    // Otherwise list coupons (Admin only)
    const isAuthorized = await isAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = `
      SELECT 
        id, code, discount_type AS discountType, 
        CAST(discount_value AS DOUBLE) AS discountValue, 
        CAST(min_order_amount AS DOUBLE) AS minOrderAmount, 
        expiry_date AS expiryDate, active, created_at AS createdAt 
      FROM coupons 
      ORDER BY created_at DESC
    `;
    const coupons = await dbQuery(sql);
    return NextResponse.json({ coupons });
  } catch (error: any) {
    console.error('Error in coupons API:', error);
    return NextResponse.json({ error: 'Failed to query coupons' }, { status: 500 });
  }
}

// POST: Register a coupon (Admin only)
export async function POST(request: Request) {
  try {
    const isAuthorized = await isAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, discountType, discountValue, minOrderAmount, expiryDate } = await request.json();

    if (!code || !discountType || !discountValue || !expiryDate) {
      return NextResponse.json({ error: 'Missing required coupon fields' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, expiry_date, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE 
        discount_type = VALUES(discount_type),
        discount_value = VALUES(discount_value),
        min_order_amount = VALUES(min_order_amount),
        expiry_date = VALUES(expiry_date),
        active = 1
    `;
    await dbQuery(sql, [
      id,
      code.trim().toUpperCase(),
      discountType,
      Number(discountValue),
      Number(minOrderAmount || 0),
      expiryDate,
    ]);

    return NextResponse.json({ message: 'Coupon registered successfully', id });
  } catch (error: any) {
    console.error('Failed to create coupon:', error);
    return NextResponse.json({ error: 'Failed to register coupon' }, { status: 500 });
  }
}

// PATCH: Toggle coupon active status (Admin only)
export async function PATCH(request: Request) {
  try {
    const isAuthorized = await isAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, active } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    const sql = 'UPDATE coupons SET active = ? WHERE id = ?';
    await dbQuery(sql, [active ? 1 : 0, id]);

    return NextResponse.json({ message: 'Coupon state updated' });
  } catch (error: any) {
    console.error('Failed to update coupon status:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

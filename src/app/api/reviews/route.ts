import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import { getSessionUser } from '@/lib/auth-server';
import { dbQuery } from '@/lib/db';

interface ReviewRow extends RowDataPacket {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  userName: string | null;
}

interface AggregateRow extends RowDataPacket {
  average: number | null;
  count: number;
}

// GET ?productId= : public list of reviews + average rating for a product.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const reviews = await dbQuery<ReviewRow[]>(
      `SELECT r.id, r.rating, r.comment,
              DATE_FORMAT(r.created_at, '%Y-%m-%d') AS createdAt,
              u.name AS userName
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [productId]
    );

    const agg = await dbQuery<AggregateRow[]>(
      'SELECT CAST(AVG(rating) AS DOUBLE) AS average, COUNT(*) AS count FROM reviews WHERE product_id = ?',
      [productId]
    );

    return NextResponse.json({
      reviews,
      average: agg[0]?.average ?? 0,
      count: agg[0]?.count ?? 0,
    });
  } catch (error) {
    console.error('Review fetch failed:', error);
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}

// POST : authenticated. One review per user per product (updates the existing one).
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to leave a review' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const productId = String(body.productId || '');
    const rating = Number(body.rating);
    const comment = String(body.comment || '').trim();

    if (!productId || !comment) {
      return NextResponse.json({ error: 'Product and comment are required' }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const existing = await dbQuery<Array<{ id: string }>>(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ? LIMIT 1',
      [user.id, productId]
    );

    if (existing.length > 0) {
      await dbQuery('UPDATE reviews SET rating = ?, comment = ? WHERE id = ?', [rating, comment, existing[0].id]);
    } else {
      await dbQuery(
        'INSERT INTO reviews (id, user_id, product_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
        [crypto.randomUUID(), user.id, productId, rating, comment]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Review save failed:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}

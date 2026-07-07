import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';

// GET: Fetch all wishlist items for logged in user
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = `
      SELECT 
        wi.product_id AS productId, 
        p.title, 
        CAST(p.price AS DOUBLE) AS price, 
        CAST(p.sale_price AS DOUBLE) AS salePrice, 
        p.featured_image AS featuredImage
      FROM wishlist_items wi
      JOIN products p ON wi.product_id = p.id
      WHERE wi.user_id = ?
    `;
    const wishlistItems = await dbQuery(sql, [user.id]);

    return NextResponse.json({ wishlistItems });
  } catch (error: any) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

// POST: Add an item to user wishlist
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Check if it already exists
    const checkSql = 'SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ? LIMIT 1';
    const existing = await dbQuery(checkSql, [user.id, productId]);

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: 'Item already in wishlist' }, { status: 200 });
    }

    // Add to wishlist
    const wishId = crypto.randomUUID();
    const insertSql = 'INSERT INTO wishlist_items (id, user_id, product_id) VALUES (?, ?, ?)';
    await dbQuery(insertSql, [wishId, user.id, productId]);

    return NextResponse.json({ message: 'Added to wishlist successfully' });
  } catch (error: any) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json({ error: 'Failed to add item to wishlist' }, { status: 500 });
  }
}

// DELETE: Remove an item from wishlist
export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const deleteSql = 'DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?';
    await dbQuery(deleteSql, [user.id, productId]);

    return NextResponse.json({ message: 'Removed from wishlist successfully' });
  } catch (error: any) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json({ error: 'Failed to remove item from wishlist' }, { status: 500 });
  }
}

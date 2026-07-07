import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';

// GET: Retrieve all cart items for authenticated user
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = `
      SELECT 
        ci.quantity, 
        p.id AS productId, 
        p.title, 
        CAST(p.price AS DOUBLE) AS price, 
        CAST(p.sale_price AS DOUBLE) AS salePrice, 
        p.featured_image AS featuredImage, 
        p.stock 
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `;
    const cartItems = await dbQuery(sql, [user.id]);

    return NextResponse.json({ cartItems });
  } catch (error: any) {
    console.error('Error fetching cart items:', error);
    return NextResponse.json({ error: 'Failed to fetch cart items' }, { status: 500 });
  }
}

// POST: Add or merge an item into database cart
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, quantity = 1 } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Verify stock availability
    const productSql = 'SELECT stock FROM products WHERE id = ? LIMIT 1';
    const products = await dbQuery(productSql, [productId]);
    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const stock = products[0].stock;

    // Check if item exists in user's cart
    const existSql = 'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? LIMIT 1';
    const existing = await dbQuery(existSql, [user.id, productId]);

    if (existing && existing.length > 0) {
      const newQty = Math.min(existing[0].quantity + quantity, stock);
      const updateSql = 'UPDATE cart_items SET quantity = ? WHERE id = ?';
      await dbQuery(updateSql, [newQty, existing[0].id]);
    } else {
      const cartItemId = crypto.randomUUID();
      const insertSql = 'INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)';
      await dbQuery(insertSql, [cartItemId, user.id, productId, Math.min(quantity, stock)]);
    }

    return NextResponse.json({ message: 'Cart synced successfully' });
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
  }
}

// PUT: Update cart item quantity
export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, quantity } = await request.json();
    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: 'Product ID and quantity are required' }, { status: 400 });
    }

    // Verify stock
    const productSql = 'SELECT stock FROM products WHERE id = ? LIMIT 1';
    const products = await dbQuery(productSql, [productId]);
    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const stock = products[0].stock;

    const targetQty = Math.max(1, Math.min(quantity, stock));

    const updateSql = 'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?';
    await dbQuery(updateSql, [targetQty, user.id, productId]);

    return NextResponse.json({ message: 'Quantity updated successfully' });
  } catch (error: any) {
    console.error('Error updating cart:', error);
    return NextResponse.json({ error: 'Failed to update quantity' }, { status: 500 });
  }
}

// DELETE: Delete items from cart
export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clear = searchParams.get('clear') === 'true';
    const productId = searchParams.get('productId');

    if (clear) {
      const deleteSql = 'DELETE FROM cart_items WHERE user_id = ?';
      await dbQuery(deleteSql, [user.id]);
      return NextResponse.json({ message: 'Cart cleared successfully' });
    }

    if (!productId) {
      return NextResponse.json({ error: 'Product ID or clear parameter is required' }, { status: 400 });
    }

    const deleteSql = 'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?';
    await dbQuery(deleteSql, [user.id, productId]);

    return NextResponse.json({ message: 'Item removed from cart' });
  } catch (error: any) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json({ error: 'Failed to delete cart item' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { dbQuery } from '@/lib/db';

interface CartPayloadItem {
  productId: string;
  title: string;
  price: number;
  salePrice: number | null;
  quantity: number;
}

interface OrderRow {
  id: string;
  userId: string;
  customerName: string | null;
  customerEmail: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  shippingAddress: string;
  trackingNumber: string | null;
  createdAt: string;
}

interface OrderItemRow {
  orderId: string;
  productId: string;
  title: string;
  quantity: number;
  price: number;
}

function formatOrderId() {
  return `MHG-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
}

function formatTrackingNumber() {
  return `MITHILA-SHIP-${Math.floor(10000000 + Math.random() * 90000000)}IN`;
}

async function fetchOrders(admin: boolean, userId: string) {
  const orderSql = `
    SELECT
      o.id,
      o.user_id AS userId,
      u.name AS customerName,
      u.email AS customerEmail,
      CAST(o.total_amount AS DOUBLE) AS totalAmount,
      o.status,
      o.payment_status AS paymentStatus,
      o.shipping_address AS shippingAddress,
      o.tracking_number AS trackingNumber,
      DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ${admin ? '' : 'WHERE o.user_id = ?'}
    ORDER BY o.created_at DESC
  `;

  const orders = await dbQuery<OrderRow[]>(orderSql, admin ? [] : [userId]);
  if (orders.length === 0) return [];

  const itemRows = await dbQuery<OrderItemRow[]>(
    `SELECT
      oi.order_id AS orderId,
      oi.product_id AS productId,
      p.title,
      oi.quantity,
      CAST(oi.price AS DOUBLE) AS price
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id IN (${orders.map(() => '?').join(',')})`,
    orders.map((order) => order.id)
  );

  return orders.map((order) => ({
    ...order,
    shippingAddress: JSON.parse(order.shippingAddress),
    items: itemRows.filter((item) => item.orderId === order.id),
  }));
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ orders: [] }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get('scope') === 'all' && user.role === 'ADMIN';
    const orders = await fetchOrders(admin, user.id);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Order fetch failed:', error);
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in before ordering' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const items = (body.items || []) as CartPayloadItem[];
    if (items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const subtotal = items.reduce((sum, item) => {
      const price = item.salePrice ?? item.price;
      return sum + price * item.quantity;
    }, 0);
    const tax = subtotal * 0.08;
    const shipping = subtotal > 250 ? 0 : 20;
    const total = subtotal + tax + shipping;
    const orderId = formatOrderId();
    const trackingNumber = formatTrackingNumber();
    const shippingAddress = JSON.stringify(body.address);

    await dbQuery(
      `INSERT INTO orders (
        id, user_id, total_amount, status, payment_status, shipping_address,
        billing_address, tax_amount, shipping_amount, tracking_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        user.id,
        total,
        'PENDING',
        'SUCCESS',
        shippingAddress,
        shippingAddress,
        tax,
        shipping,
        trackingNumber,
      ]
    );

    for (const item of items) {
      await dbQuery(
        'INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [crypto.randomUUID(), orderId, item.productId, item.quantity, item.salePrice ?? item.price]
      );
      await dbQuery('UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?', [item.quantity, item.productId]);
    }

    return NextResponse.json({
      order: {
        id: orderId,
        totalAmount: total,
        status: 'PENDING',
        paymentStatus: 'SUCCESS',
        trackingNumber,
        shippingAddress: body.address,
        items,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Order create failed:', error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.id || !body.status) {
      return NextResponse.json({ error: 'Order id and status are required' }, { status: 400 });
    }

    await dbQuery('UPDATE orders SET status = ? WHERE id = ?', [body.status, body.id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Order status update failed:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

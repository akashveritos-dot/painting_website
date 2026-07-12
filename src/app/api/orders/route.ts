import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { dbQuery } from '@/lib/db';

interface OrderRow {
  id: string;
  userId: string;
  customerName: string | null;
  customerEmail: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
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
      pay.razorpay_order_id AS razorpayOrderId,
      pay.razorpay_payment_id AS razorpayPaymentId,
      o.shipping_address AS shippingAddress,
      o.tracking_number AS trackingNumber,
      DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN payments pay ON pay.order_id = o.id
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

export async function POST() {
  return NextResponse.json(
    { error: 'Create orders through /api/payments/create-order' },
    { status: 405 }
  );
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

    const allowedStatuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }

    await dbQuery('UPDATE orders SET status = ? WHERE id = ?', [body.status, body.id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Order status update failed:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

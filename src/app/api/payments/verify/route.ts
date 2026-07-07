import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import { getSessionUser } from '@/lib/auth-server';
import { dbTransaction } from '@/lib/db';
import { verifyRazorpaySignature } from '@/lib/razorpay';

interface PaymentRow extends RowDataPacket {
  id: string;
  orderId: string;
  status: string;
  razorpayPaymentId: string | null;
}

interface OrderItemRow extends RowDataPacket {
  productId: string;
  quantity: number;
  title: string;
  stock: number;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in before payment verification' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const razorpayOrderId = String(body.razorpay_order_id || '');
    const razorpayPaymentId = String(body.razorpay_payment_id || '');
    const razorpaySignature = String(body.razorpay_signature || '');

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Razorpay payment response is incomplete' }, { status: 400 });
    }

    const verified = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!verified) {
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    const result = await dbTransaction(async (connection) => {
      const [payments] = await connection.execute<PaymentRow[]>(
        `SELECT id, order_id AS orderId, status, razorpay_payment_id AS razorpayPaymentId
         FROM payments
         WHERE razorpay_order_id = ?
         FOR UPDATE`,
        [razorpayOrderId]
      );

      const payment = payments[0];
      if (!payment) {
        throw new Error('Payment attempt not found');
      }

      if (payment.status === 'SUCCESS') {
        return { orderId: payment.orderId, alreadyVerified: true };
      }

      const [items] = await connection.execute<OrderItemRow[]>(
        `SELECT
          oi.product_id AS productId,
          oi.quantity,
          p.title,
          p.stock
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?
         FOR UPDATE`,
        [payment.orderId]
      );

      for (const item of items) {
        if (item.stock < item.quantity) {
          throw new Error(`${item.title} is no longer available in the requested quantity`);
        }
      }

      for (const item of items) {
        await connection.execute(
          'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
          [item.quantity, item.productId, item.quantity]
        );
      }

      await connection.execute(
        `UPDATE payments
         SET status = ?, razorpay_payment_id = ?, razorpay_signature = ?
         WHERE id = ?`,
        ['SUCCESS', razorpayPaymentId, razorpaySignature, payment.id]
      );

      await connection.execute(
        'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
        ['SUCCESS', 'PAID', payment.orderId]
      );

      return { orderId: payment.orderId, alreadyVerified: false };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('Payment verification failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

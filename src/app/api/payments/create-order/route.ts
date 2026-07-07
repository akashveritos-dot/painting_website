import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getSessionUser } from '@/lib/auth-server';
import { dbQuery, dbTransaction } from '@/lib/db';
import { createRazorpayOrder } from '@/lib/razorpay';

interface CartPayloadItem {
  productId: string;
  quantity: number;
}

interface ProductRow extends RowDataPacket {
  id: string;
  title: string;
  price: number;
  salePrice: number | null;
  stock: number;
  status: string;
}

interface ExistingPaymentRow extends RowDataPacket {
  orderId: string;
  razorpayOrderId: string | null;
  amount: number;
  status: string;
}

function generateInternalOrderId() {
  return `MHG-ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function generateTrackingNumber() {
  return `MITHILA-SHIP-${Math.floor(10000000 + Math.random() * 90000000)}IN`;
}

async function ensurePaymentColumns() {
  const alters = [
    'ALTER TABLE payments ADD COLUMN razorpay_order_id VARCHAR(255) DEFAULT NULL UNIQUE',
    'ALTER TABLE payments ADD COLUMN razorpay_payment_id VARCHAR(255) DEFAULT NULL UNIQUE',
    'ALTER TABLE payments ADD COLUMN razorpay_signature VARCHAR(255) DEFAULT NULL',
    'ALTER TABLE payments ADD COLUMN idempotency_key VARCHAR(255) DEFAULT NULL UNIQUE',
  ];

  for (const statement of alters) {
    try {
      await dbQuery(statement);
    } catch {
      // Column or index already exists.
    }
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in before payment' }, { status: 401 });
  }

  try {
    await ensurePaymentColumns();
    const body = await request.json();
    const items = (body.items || []) as CartPayloadItem[];
    const idempotencyKey = String(body.idempotencyKey || '');

    if (!idempotencyKey) {
      return NextResponse.json({ error: 'Idempotency key is required' }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const existing = await dbQuery<ExistingPaymentRow[]>(
      `SELECT order_id AS orderId, razorpay_order_id AS razorpayOrderId, CAST(amount AS DOUBLE) AS amount, status
       FROM payments
       WHERE idempotency_key = ?
       LIMIT 1`,
      [idempotencyKey]
    );

    if (existing[0]?.razorpayOrderId) {
      return NextResponse.json({
        order: {
          id: existing[0].orderId,
          razorpayOrderId: existing[0].razorpayOrderId,
          amount: Math.round(existing[0].amount * 100),
          currency: 'INR',
          status: existing[0].status,
        },
      });
    }

    const result = await dbTransaction(async (connection) => {
      const internalOrderId = generateInternalOrderId();
      const shippingAddress = JSON.stringify(body.address);
      const normalizedItems = items.map((item) => ({
        productId: item.productId,
        quantity: Math.max(1, Number(item.quantity || 1)),
      }));

      const productIds = normalizedItems.map((item) => item.productId);
      const [productRows] = await connection.execute<ProductRow[]>(
        `SELECT id, title, CAST(price AS DOUBLE) AS price, CAST(sale_price AS DOUBLE) AS salePrice, stock, status
         FROM products
         WHERE id IN (${productIds.map(() => '?').join(',')})
         FOR UPDATE`,
        productIds
      );

      if (productRows.length !== normalizedItems.length) {
        throw new Error('Some products are no longer available');
      }

      let subtotal = 0;
      for (const item of normalizedItems) {
        const product = productRows.find((row) => row.id === item.productId);
        if (!product || product.status !== 'PUBLISHED') {
          throw new Error('A selected product is not available');
        }
        if (product.stock < item.quantity) {
          throw new Error(`${product.title} has only ${product.stock} left in stock`);
        }
        subtotal += (product.salePrice ?? product.price) * item.quantity;
      }

      const tax = subtotal * 0.08;
      const shipping = subtotal > 250 ? 0 : 20;
      const total = Number((subtotal + tax + shipping).toFixed(2));
      const amountPaise = Math.round(total * 100);

      await connection.execute(
        `INSERT INTO orders (
          id, user_id, total_amount, status, payment_status, shipping_address,
          billing_address, tax_amount, shipping_amount, tracking_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          internalOrderId,
          user.id,
          total,
          'PENDING',
          'PENDING',
          shippingAddress,
          shippingAddress,
          tax,
          shipping,
          generateTrackingNumber(),
        ]
      );

      for (const item of normalizedItems) {
        const product = productRows.find((row) => row.id === item.productId);
        await connection.execute(
          'INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
          [crypto.randomUUID(), internalOrderId, item.productId, item.quantity, product?.salePrice ?? product?.price ?? 0]
        );
      }

      await connection.execute<ResultSetHeader>(
        `INSERT INTO payments (id, order_id, payment_method, status, amount, idempotency_key)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), internalOrderId, 'RAZORPAY', 'PENDING', total, idempotencyKey]
      );

      const razorpayOrder = await createRazorpayOrder({
        amountPaise,
        currency: 'INR',
        receipt: internalOrderId,
        notes: {
          internal_order_id: internalOrderId,
          user_id: user.id,
        },
      });

      await connection.execute(
        'UPDATE payments SET razorpay_order_id = ? WHERE order_id = ?',
        [razorpayOrder.id, internalOrderId]
      );

      return {
        id: internalOrderId,
        razorpayOrderId: razorpayOrder.id,
        amount: amountPaise,
        currency: 'INR',
      };
    });

    return NextResponse.json({ order: result }, { status: 201 });
  } catch (error) {
    console.error('Payment order creation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment order' },
      { status: 500 }
    );
  }
}

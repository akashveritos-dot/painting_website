import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getSessionUser } from '@/lib/auth-server';
import { dbQuery, dbTransaction } from '@/lib/db';
import { createRazorpayOrder } from '@/lib/razorpay';
import { computeTotals, type PricingCoupon } from '@/lib/pricing';

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

interface CouponRow extends RowDataPacket {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  expiryDate: string;
  active: number;
}

function generateInternalOrderId() {
  return `MHG-ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function generateTrackingNumber() {
  return `MITHILA-SHIP-${Math.floor(10000000 + Math.random() * 90000000)}IN`;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in before payment' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const items = (body.items || []) as CartPayloadItem[];
    const idempotencyKey = String(body.idempotencyKey || '');
    const couponCode = String(body.couponCode || '').trim().toUpperCase();

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

      // Re-validate the coupon server-side; never trust a discount from the browser.
      let coupon: PricingCoupon | null = null;
      let appliedCode: string | null = null;
      if (couponCode) {
        const [couponRows] = await connection.execute<CouponRow[]>(
          `SELECT code, discount_type AS discountType, CAST(discount_value AS DOUBLE) AS discountValue,
                  CAST(min_order_amount AS DOUBLE) AS minOrderAmount, expiry_date AS expiryDate, active
           FROM coupons WHERE code = ? LIMIT 1`,
          [couponCode]
        );
        const row = couponRows[0];
        // Silently drop an invalid/expired/min-not-met coupon rather than fail the
        // whole order; the charged total simply reflects no discount.
        if (
          row &&
          row.active &&
          new Date(row.expiryDate) >= new Date() &&
          subtotal >= row.minOrderAmount
        ) {
          coupon = {
            discountType: row.discountType,
            discountValue: row.discountValue,
            minOrderAmount: row.minOrderAmount,
          };
          appliedCode = row.code;
        }
      }

      const totals = computeTotals(subtotal, coupon);
      const amountPaise = Math.round(totals.total * 100);

      await connection.execute(
        `INSERT INTO orders (
          id, user_id, total_amount, status, payment_status, shipping_address,
          billing_address, coupon_code, discount_amount, tax_amount, shipping_amount, tracking_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          internalOrderId,
          user.id,
          totals.total,
          'PENDING',
          'PENDING',
          shippingAddress,
          shippingAddress,
          appliedCode,
          totals.discount,
          totals.tax,
          totals.shipping,
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
        [crypto.randomUUID(), internalOrderId, 'RAZORPAY', 'PENDING', totals.total, idempotencyKey]
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

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, PackageCheck, ShoppingBag, Truck } from 'lucide-react';

const BRAND_LOGO_PATH = '/icon madhubni-Photoroom.png';

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  trackingNumber: string | null;
  createdAt: string;
  shippingAddress: {
    fullName?: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    price: number;
  }>;
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true,
  }).format(new Date(value.replace(' ', 'T')));
}

function downloadReceipt(order: Order) {
  const logoUrl = `${window.location.origin}${BRAND_LOGO_PATH.replaceAll(' ', '%20')}`;
  const itemRows = order.items
    .map((item) => {
      const lineTotal = item.price * item.quantity;
      return `
        <tr>
          <td>${escapeHtml(item.title)}</td>
          <td>${escapeHtml(item.quantity)}</td>
          <td>INR ${escapeHtml(item.price.toFixed(2))}</td>
          <td>INR ${escapeHtml(lineTotal.toFixed(2))}</td>
        </tr>
      `;
    })
    .join('');

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Mithila Receipt ${escapeHtml(order.id)}</title>
    <style>
      body { margin: 0; background: #f8f1df; color: #261f19; font-family: Arial, sans-serif; }
      .sheet { max-width: 860px; margin: 28px auto; background: #fffaf0; border: 2px solid #261f19; padding: 28px; }
      .double { border: 1px solid #261f19; padding: 24px; }
      header { display: flex; align-items: center; justify-content: space-between; gap: 24px; border-bottom: 1px solid #d8c7a5; padding-bottom: 20px; }
      .brand { display: flex; align-items: center; gap: 14px; }
      img { width: 76px; height: 76px; object-fit: contain; }
      h1 { margin: 0; font-family: Georgia, serif; letter-spacing: 0.12em; color: #9f5138; }
      h2 { margin: 24px 0 10px; font-family: Georgia, serif; }
      .muted { color: #6d6257; font-size: 12px; line-height: 1.5; }
      .pill { display: inline-block; border: 1px solid #9f5138; color: #9f5138; padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 22px; }
      .box { border: 1px solid #d8c7a5; padding: 14px; background: #fffdf7; }
      .label { display: block; color: #6d6257; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border-bottom: 1px solid #d8c7a5; padding: 12px 8px; text-align: left; font-size: 13px; }
      th { color: #6d6257; text-transform: uppercase; font-size: 10px; letter-spacing: 0.12em; }
      .total { text-align: right; font-family: Georgia, serif; font-size: 24px; font-weight: 700; margin-top: 18px; }
      footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #d8c7a5; font-size: 11px; color: #6d6257; }
      @media print { body { background: white; } .sheet { margin: 0; border: none; } }
    </style>
  </head>
  <body>
    <main class="sheet">
      <div class="double">
        <header>
          <div class="brand">
            <img src="${logoUrl}" alt="Mithila Heritage Gallery" />
            <div>
              <h1>MITHILA</h1>
              <div class="muted">Heritage Gallery / Payment Receipt</div>
            </div>
          </div>
          <span class="pill">${escapeHtml(order.paymentStatus)}</span>
        </header>

        <section class="grid">
          <div class="box">
            <span class="label">Internal Order ID</span>
            <strong>${escapeHtml(order.id)}</strong>
          </div>
          <div class="box">
            <span class="label">Order Date</span>
            <strong>${escapeHtml(formatDate(order.createdAt))}</strong>
          </div>
          <div class="box">
            <span class="label">Razorpay Order ID</span>
            <strong>${escapeHtml(order.razorpayOrderId || 'Pending')}</strong>
          </div>
          <div class="box">
            <span class="label">Razorpay Payment ID</span>
            <strong>${escapeHtml(order.razorpayPaymentId || 'Pending')}</strong>
          </div>
          <div class="box">
            <span class="label">Fulfillment Status</span>
            <strong>${escapeHtml(order.status)}</strong>
          </div>
          <div class="box">
            <span class="label">Tracking</span>
            <strong>${escapeHtml(order.trackingNumber || 'Pending')}</strong>
          </div>
        </section>

        <h2>Shipping Address</h2>
        <div class="box">
          <strong>${escapeHtml(order.shippingAddress.fullName || 'Art Patron')}</strong><br />
          ${escapeHtml(order.shippingAddress.address)}, ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.state)} - ${escapeHtml(order.shippingAddress.zip)}
        </div>

        <h2>Purchased Artworks</h2>
        <table>
          <thead>
            <tr><th>Artwork</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div class="total">Grand Total: INR ${escapeHtml(order.totalAmount.toFixed(2))}</div>

        <footer>
          This receipt confirms payment/order records held by Mithila Heritage Gallery. Certificates and artisan provenance documents are dispatched with eligible artwork shipments.
        </footer>
      </div>
    </main>
  </body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mithila-receipt-${order.id}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => {
        if (res.status === 401) throw new Error('Please sign in to view your orders.');
        return res.json();
      })
      .then((data) => {
        if (data?.orders) setOrders(data.orders);
      })
      .catch((err) => setError(err.message || 'Could not load orders.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl w-full px-6 py-12 md:py-20">
      <div className="mb-8">
        <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-madhubani-terracotta dark:text-madhubani-mustard">
          Patron Account
        </span>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mt-1">My Orders</h1>
        <p className="text-sm text-foreground/60 mt-2">Track acquisitions, shipping addresses, and fulfillment status.</p>
      </div>

      {loading ? (
        <div className="glass-panel h-56 rounded-xl border animate-pulse" />
      ) : error ? (
        <div className="glass-panel rounded-xl border p-8 text-center">
          <p className="text-sm text-foreground/65">{error}</p>
          <Link href="/auth/login" className="clickable btn-heritage mt-5 inline-flex rounded-lg px-5 py-3 text-xs font-bold">
            Sign In
          </Link>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel rounded-xl border p-8 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-accent" />
          <h2 className="font-serif text-2xl font-bold mt-4">No Orders Yet</h2>
          <p className="text-sm text-foreground/60 mt-2">Your confirmed artwork acquisitions will appear here.</p>
          <Link href="/gallery" className="clickable btn-heritage mt-5 inline-flex rounded-lg px-5 py-3 text-xs font-bold">
            Browse Gallery
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="glass-panel rounded-xl border p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PackageCheck className="h-5 w-5 text-accent" />
                    <h2 className="font-serif text-xl font-bold">{order.id}</h2>
                    <span className="rounded-full bg-madhubani-mustard/15 px-2.5 py-1 text-[10px] font-bold uppercase">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/55 mt-2">{formatDate(order.createdAt)}</p>
                  <p className="text-xs text-foreground/65 mt-3 leading-relaxed">
                    {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <span className="font-serif text-2xl font-bold">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                  <p className="text-xs text-foreground/55 mt-1 flex items-center gap-1 md:justify-end">
                    <Truck className="h-3.5 w-3.5" />
                    {order.trackingNumber || 'Tracking pending'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 md:justify-end">
                    <Link
                      href={`/orders/${order.id}`}
                      className="clickable inline-flex items-center gap-1.5 rounded-lg bg-madhubani-terracotta dark:bg-madhubani-mustard px-3 py-2 text-xs font-bold text-white dark:text-madhubani-soot hover:opacity-90"
                    >
                      <Truck className="h-3.5 w-3.5" />
                      Track Order
                    </Link>
                    <button
                      onClick={() => downloadReceipt(order)}
                      className="clickable inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-foreground/5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Receipt
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.productId}`} className="rounded-lg border border-border bg-background/35 p-3 text-xs">
                    <span className="font-bold">{item.title}</span>
                    <span className="block text-foreground/60 mt-1">Qty {item.quantity} / ₹{item.price.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

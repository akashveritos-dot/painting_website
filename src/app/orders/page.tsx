'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PackageCheck, ShoppingBag, Truck } from 'lucide-react';

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true,
  }).format(new Date(value.replace(' ', 'T')));
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
                  <span className="font-serif text-2xl font-bold">${order.totalAmount.toFixed(2)}</span>
                  <p className="text-xs text-foreground/55 mt-1 flex items-center gap-1 md:justify-end">
                    <Truck className="h-3.5 w-3.5" />
                    {order.trackingNumber || 'Tracking pending'}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.productId}`} className="rounded-lg border border-border bg-background/35 p-3 text-xs">
                    <span className="font-bold">{item.title}</span>
                    <span className="block text-foreground/60 mt-1">Qty {item.quantity} / ${item.price.toFixed(2)}</span>
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

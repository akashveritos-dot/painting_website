'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, PackageCheck, XCircle } from 'lucide-react';

interface AdminOrder {
  id: string;
  customerName: string | null;
  customerEmail: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  trackingNumber: string | null;
  createdAt: string;
  shippingAddress: {
    fullName?: string;
    email?: string;
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

const STATUS_ACTIONS = [
  { status: 'PAID', label: 'Accept', icon: CheckCircle2 },
  { status: 'SHIPPED', label: 'Proceed', icon: PackageCheck },
  { status: 'CANCELLED', label: 'Reject', icon: XCircle },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true,
  }).format(new Date(value.replace(' ', 'T')));
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const loadOrders = () => {
    fetch('/api/orders?scope=all')
      .then((res) => res.json())
      .then((data) => {
        if (data?.orders) setOrders(data.orders);
      })
      .catch((error) => {
        console.error('Failed to load orders:', error);
        setStatus('Could not load orders.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id: string, nextStatus: string) => {
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: nextStatus }),
    });

    if (res.ok) {
      setOrders((current) => current.map((order) => (order.id === id ? { ...order, status: nextStatus } : order)));
      setStatus(`Order ${id} moved to ${nextStatus}.`);
    } else {
      setStatus('Could not update order status.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-madhubani-terracotta dark:text-madhubani-mustard">
          Fulfillment
        </span>
        <h1 className="font-serif text-2xl md:text-3xl font-bold mt-1">Review Orders</h1>
        <p className="text-sm text-foreground/60 mt-1">Review customer details, addresses, items, and move orders forward.</p>
      </div>

      {status && <div className="rounded-lg border border-madhubani-forest/25 bg-madhubani-forest/10 px-4 py-3 text-xs font-semibold text-madhubani-forest">{status}</div>}

      {loading ? (
        <div className="glass-panel h-64 rounded-xl border animate-pulse" />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="glass-panel rounded-xl border p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-xl font-bold">{order.id}</h2>
                    <span className="rounded-full bg-madhubani-mustard/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/55 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(order.createdAt)}
                  </p>
                  <p className="mt-3 text-sm font-semibold">{order.customerName || 'Customer'} / {order.customerEmail}</p>
                  <p className="mt-1 text-xs text-foreground/65 leading-relaxed">
                    {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}
                  </p>
                  <p className="mt-2 text-xs text-foreground/55">
                    Razorpay Order: {order.razorpayOrderId || 'Pending'} / Payment: {order.razorpayPaymentId || 'Pending'}
                  </p>
                </div>
                <div className="text-left xl:text-right">
                  <span className="font-serif text-2xl font-bold">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                  <p className="text-xs text-foreground/55 mt-1">Tracking: {order.trackingNumber || 'Pending'}</p>
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

              <div className="mt-5 flex flex-wrap gap-2">
                {STATUS_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.status}
                      onClick={() => updateStatus(order.id, action.status)}
                      className="clickable inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-foreground/5"
                    >
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

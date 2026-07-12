'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ClipboardCheck,
  CreditCard,
  Truck,
  PackageCheck,
  MapPin,
  XCircle,
} from 'lucide-react';

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
  items: Array<{ productId: string; title: string; quantity: number; price: number }>;
}

const STEPS = [
  { key: 'PLACED', label: 'Order Placed', desc: 'We received your acquisition request', icon: ClipboardCheck },
  { key: 'PAID', label: 'Payment Confirmed', desc: 'Payment verified and secured', icon: CreditCard },
  { key: 'SHIPPED', label: 'Shipped', desc: 'Handed to the courier with certificates', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Artwork delivered to your address', icon: PackageCheck },
];

// Map the DB order status to the furthest completed step.
function currentStepIndex(status: string) {
  switch (status) {
    case 'PENDING': return 0;
    case 'PAID': return 1;
    case 'SHIPPED': return 2;
    case 'DELIVERED': return 3;
    default: return -1; // CANCELLED / unknown
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value.replace(' ', 'T')));
}

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const reduceMotion = useReducedMotion();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // /api/orders only returns the signed-in user's own orders, so finding by id here is ownership-safe.
    fetch('/api/orders')
      .then((res) => {
        if (res.status === 401) throw new Error('Please sign in to track your order.');
        return res.json();
      })
      .then((data) => {
        const found = (data?.orders || []).find((o: Order) => o.id === id);
        if (!found) throw new Error('Order not found in your account.');
        setOrder(found);
      })
      .catch((err) => setError(err.message || 'Could not load this order.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-madhubani-terracotta border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-sm text-foreground/65">{error || 'Order not found.'}</p>
        <Link href="/orders" className="clickable btn-heritage mt-6 inline-flex rounded-lg px-5 py-3 text-xs font-bold">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const stepIndex = currentStepIndex(order.status);
  const cancelled = order.status === 'CANCELLED';
  const estimatedDelivery = (() => {
    const d = new Date(order.createdAt.replace(' ', 'T'));
    d.setDate(d.getDate() + 7);
    return formatDate(d.toISOString());
  })();

  return (
    <div className="mx-auto max-w-4xl w-full px-6 py-12 md:py-20">
      <Link
        href="/orders"
        className="clickable inline-flex items-center gap-2 text-xs font-bold text-foreground/60 hover:text-foreground font-sans uppercase tracking-wider mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Orders
      </Link>

      {/* Header */}
      <div className="mb-10">
        <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-madhubani-terracotta dark:text-madhubani-mustard">
          Order Journey
        </span>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mt-1">{order.id}</h1>
        <p className="text-sm text-foreground/60 mt-2">
          Placed {formatDate(order.createdAt)}
          {order.trackingNumber && <> · Tracking <span className="font-mono">{order.trackingNumber}</span></>}
        </p>
      </div>

      {cancelled ? (
        <div className="glass-panel rounded-xl border p-6 flex items-center gap-3">
          <XCircle className="h-8 w-8 text-madhubani-vermillion flex-shrink-0" />
          <div>
            <p className="font-serif text-lg font-bold text-foreground">Order Cancelled</p>
            <p className="text-sm text-foreground/60 mt-0.5">This order was cancelled. Contact support if this is unexpected.</p>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-xl border p-6 md:p-8 relative">
          <div className="pointer-events-none absolute inset-2 rounded-lg border border-foreground/5" />
          <div className="relative flex items-center justify-between mb-8">
            <h2 className="font-serif text-xl font-bold">Tracking Progress</h2>
            <span className="text-xs font-semibold text-foreground/55">Est. delivery {estimatedDelivery}</span>
          </div>

          {/* Vertical Madhubani order-journey timeline */}
          <ol className="relative space-y-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = i <= stepIndex;
              const current = i === stepIndex;
              return (
                <li key={step.key} className="relative flex items-start gap-4 pl-1">
                  {/* Connecting painted path to the next step */}
                  {i < STEPS.length - 1 && (
                    <span className="absolute left-[22px] top-11 h-[calc(100%+1rem)] w-[2px] bg-border" aria-hidden>
                      <motion.span
                        className="block w-full bg-madhubani-forest origin-top"
                        initial={reduceMotion ? { scaleY: i < stepIndex ? 1 : 0 } : { scaleY: 0 }}
                        animate={{ scaleY: i < stepIndex ? 1 : 0 }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.15 * i }}
                        style={{ height: '100%' }}
                      />
                    </span>
                  )}
                  {/* Step medallion */}
                  <span
                    className={`relative z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      done
                        ? 'border-madhubani-forest bg-madhubani-forest text-white'
                        : 'border-border bg-card text-foreground/35'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="pt-1.5">
                    <p className={`font-serif font-bold ${done ? 'text-foreground' : 'text-foreground/45'}`}>
                      {step.label}
                      {current && <span className="ml-2 text-[10px] font-sans font-bold uppercase tracking-wider text-madhubani-forest">Current</span>}
                    </p>
                    <p className="text-xs text-foreground/55 mt-0.5">{step.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="glass-panel rounded-xl border p-6">
          <h3 className="font-serif text-lg font-bold flex items-center gap-2 mb-3">
            <MapPin className="h-4.5 w-4.5 text-accent" /> Shipping Address
          </h3>
          <p className="text-sm text-foreground/75 leading-relaxed">
            <span className="font-semibold text-foreground">{order.shippingAddress.fullName || 'Art Patron'}</span><br />
            {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}
          </p>
        </div>

        <div className="glass-panel rounded-xl border p-6">
          <h3 className="font-serif text-lg font-bold mb-3">Payment Summary</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/70">Status</span>
            <span className="font-semibold">{order.paymentStatus}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2 border-t border-border pt-2">
            <span className="text-foreground/70">Amount Paid</span>
            <span className="font-serif text-lg font-bold">₹{order.totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="glass-panel rounded-xl border p-6 mt-6">
        <h3 className="font-serif text-lg font-bold mb-4">Artworks in this Order</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {order.items.map((item) => (
            <div key={`${order.id}-${item.productId}`} className="rounded-lg border border-border bg-background/35 p-3 text-xs">
              <span className="font-bold">{item.title}</span>
              <span className="block text-foreground/60 mt-1">Qty {item.quantity} / ₹{item.price.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

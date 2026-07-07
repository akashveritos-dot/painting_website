'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Award, 
  Printer 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayPaymentResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

function getCheckoutIdempotencyKey() {
  const storageKey = 'madhubani-checkout-idempotency-key';
  let key = window.sessionStorage.getItem(storageKey);

  if (!key) {
    key = crypto.randomUUID();
    window.sessionStorage.setItem(storageKey, key);
  }

  return key;
}

function clearCheckoutIdempotencyKey() {
  window.sessionStorage.removeItem('madhubani-checkout-idempotency-key');
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { user, cart, clearCart } = useAppStore();
  const [savedAddresses, setSavedAddresses] = useState<Array<{
    id: string;
    fullName: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  }>>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  // UI Flow State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'success'>('form');
  const [generatedOrderId, setGeneratedOrderId] = useState('');
  const [generatedTracking, setGeneratedTracking] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/addresses')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.addresses) setSavedAddresses(data.addresses);
      })
      .catch((error) => console.error('Failed to load saved addresses:', error));
  }, []);

  // Calculations
  const subtotal = cart.reduce((acc, item) => {
    const price = item.salePrice ?? item.price;
    return acc + price * item.quantity;
  }, 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal > 25000 ? 0.00 : 2000.00;
  const total = subtotal + tax + shipping;

  const applySavedAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    const saved = savedAddresses.find((item) => item.id === addressId);
    if (!saved) return;

    setName(saved.fullName);
    setEmail(saved.email);
    setAddress(saved.address);
    setCity(saved.city);
    setState(saved.state);
    setZip(saved.zip);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !address || !city || !state || !zip) {
      alert('Please fill in all required fields');
      return;
    }
    if (!user) {
      alert('Please sign in before placing an order so it can be saved to your account.');
      return;
    }

    setIsSubmitting(true);
    setPaymentError(null);

    try {
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error('Razorpay Checkout could not be loaded');
      }

      const addressPayload = {
        id: selectedAddressId || undefined,
        fullName: name,
        email,
        address,
        city,
        state,
        zip,
        isDefault: true,
      };

      await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressPayload),
      });

      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: addressPayload,
          items: cart,
          idempotencyKey: getCheckoutIdempotencyKey(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Payment order failed');
      }

      const data = await res.json();
      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Mithila Heritage Gallery',
        description: `Order ${data.order.id}`,
        order_id: data.order.razorpayOrderId,
        prefill: {
          name,
          email,
        },
        theme: {
          color: '#9f5138',
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            if (!verifyRes.ok) {
              const error = await verifyRes.json();
              throw new Error(error.error || 'Payment verification failed');
            }

            setGeneratedOrderId(data.order.id);
            setGeneratedTracking('Tracking will be assigned after fulfillment review');
            setCheckoutStep('success');
            clearCart();
            clearCheckoutIdempotencyKey();
          } catch (error) {
            setPaymentError(error instanceof Error ? error.message : 'Payment verification failed');
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            setPaymentError('Payment was cancelled before completion.');
          },
        },
      });

      razorpay.open();
    } catch (error) {
      console.error('Checkout failed:', error);
      setPaymentError(error instanceof Error ? error.message : 'Could not start payment. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (checkoutStep === 'success') {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-12 md:py-24 relative overflow-hidden">
        {/* Confetti decoration circles */}
        <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-madhubani-mustard/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-madhubani-terracotta/5 blur-3xl animate-pulse" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel w-full max-w-2xl p-8 md:p-12 rounded-2xl shadow-2xl border text-center relative"
        >
          <div className="absolute inset-2 border border-foreground/5 rounded-xl pointer-events-none" />

          {/* Success Indicator */}
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="h-16 w-16 text-madhubani-forest" />
          </div>

          <span className="font-sans text-xs font-bold uppercase tracking-widest text-madhubani-forest mb-2 block">
            Acquisition Confirmed
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            Welcome to the Mithila Registry
          </h2>
          <p className="text-sm text-foreground/60 mt-3 max-w-md mx-auto leading-relaxed">
            Your transaction has been approved. Your custom Certificate of Authenticity is being printed and sealed with the artist signature.
          </p>

          {/* Order Details box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 p-6 bg-card/20 border border-border rounded-xl text-left font-sans text-xs">
            <div>
              <span className="text-foreground/50 block font-semibold uppercase tracking-wider">Order Reference</span>
              <span className="text-sm font-bold text-foreground mt-1 block font-mono">{generatedOrderId}</span>
            </div>
            <div>
              <span className="text-foreground/50 block font-semibold uppercase tracking-wider">Tracking Reference</span>
              <span className="text-sm font-bold text-foreground mt-1 block font-mono">{generatedTracking}</span>
            </div>
            <div className="border-t border-border pt-3 mt-1 col-span-1 md:col-span-2">
              <span className="text-foreground/50 block font-semibold uppercase tracking-wider">Shipment Destination</span>
              <span className="text-sm font-semibold text-foreground mt-1 block leading-relaxed">{name}, {address}, {city}, {state} - {zip}</span>
            </div>
          </div>

          {/* Authentication Badge */}
          <div className="flex items-center gap-3 justify-center p-4 bg-madhubani-mustard/10 border border-madhubani-mustard/20 rounded-xl mt-6 max-w-sm mx-auto text-left">
            <Award className="h-8 w-8 text-madhubani-terracotta flex-shrink-0" />
            <div>
              <span className="font-serif text-xs font-bold text-foreground block">Mithila Artisans Guild Seal</span>
              <span className="font-sans text-[10px] text-foreground/75 mt-0.5 block leading-relaxed">
                Hand-painted certification seal and artisan profile sheet dispatched with package.
              </span>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
            <button
              onClick={() => window.print()}
              className="clickable flex items-center justify-center gap-1.5 px-6 py-3 border border-border hover:bg-foreground/5 rounded-lg text-xs font-bold font-sans uppercase tracking-wider"
            >
              <Printer className="h-4 w-4" /> Print Invoice
            </button>
            <Link
              href="/orders"
              className="clickable flex items-center justify-center gap-1.5 px-6 py-3 bg-madhubani-terracotta dark:bg-madhubani-mustard text-white dark:text-madhubani-soot rounded-lg text-xs font-bold font-serif uppercase tracking-wider shadow-md hover:opacity-90 transition-opacity"
            >
              View My Orders <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-sans text-sm text-foreground/50">Your cart is empty. Please add items to checkout.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-6 py-12 md:py-20">
      
      {/* Back button */}
      <Link
        href="/cart"
        className="clickable inline-flex items-center gap-2 text-xs font-bold text-foreground/60 hover:text-foreground font-sans uppercase tracking-wider mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Return to Cart
      </Link>

      {/* Transition Loader overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md"
          >
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-madhubani-terracotta border-t-transparent" />
            <h3 className="font-serif text-xl font-bold text-foreground mt-6 tracking-wide">
              Processing Transaction
            </h3>
            <p className="text-xs text-foreground/60 mt-2 font-sans tracking-wide">
              Securing SSL connection and registering certificates...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-10">
        <h1 className="font-serif text-3xl font-bold text-foreground">Secure Acquisition</h1>
        <p className="text-sm text-foreground/60 mt-1.5">
          Enter shipping addresses and finalize patron certificate records.
        </p>
        {paymentError && (
          <p className="mt-4 rounded-lg border border-madhubani-vermillion/25 bg-madhubani-vermillion/10 px-4 py-3 text-xs font-semibold text-madhubani-vermillion">
            {paymentError}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Form blocks */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Shipping Form */}
          <div className="glass-panel p-6 md:p-8 rounded-xl border relative">
            <div className="absolute inset-2 border border-foreground/5 rounded-lg pointer-events-none" />

            <h3 className="font-serif text-xl font-bold text-foreground border-b border-border pb-4 mb-6 flex items-center gap-2 relative z-10">
              <Truck className="h-5 w-5 text-accent" /> Shipping Destination
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10 text-xs font-semibold uppercase tracking-wide font-sans">
              {savedAddresses.length > 0 && (
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label htmlFor="saved-address" className="text-foreground/70">Use Saved Address</label>
                  <select
                    id="saved-address"
                    value={selectedAddressId}
                    onChange={(e) => applySavedAddress(e.target.value)}
                    className="w-full border border-border bg-background/50 px-4 py-3 text-sm font-sans normal-case rounded-lg focus:outline-none focus:border-accent"
                  >
                    <option value="">Enter a new address</option>
                    {savedAddresses.map((saved) => (
                      <option key={saved.id} value={saved.id}>
                        {saved.fullName} - {saved.city}, {saved.state}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label htmlFor="name" className="text-foreground/70">Patron Full Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Aanya Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-border bg-background/50 px-4 py-3 text-sm font-sans normal-case rounded-lg focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2">
                <label htmlFor="email" className="text-foreground/70">Email Address (Invoices & Tracking)</label>
                <input
                  id="email"
                  type="email"
                  placeholder="aanya@patron.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-border bg-background/50 px-4 py-3 text-sm font-sans normal-case rounded-lg focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2">
                <label htmlFor="address" className="text-foreground/70">Delivery Address</label>
                <input
                  id="address"
                  type="text"
                  placeholder="Flat / House No, Street name"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-border bg-background/50 px-4 py-3 text-sm font-sans normal-case rounded-lg focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="city" className="text-foreground/70">City</label>
                <input
                  id="city"
                  type="text"
                  placeholder="Patna"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-border bg-background/50 px-4 py-3 text-sm font-sans normal-case rounded-lg focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="state" className="text-foreground/70">State / Region</label>
                <input
                  id="state"
                  type="text"
                  placeholder="Bihar"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full border border-border bg-background/50 px-4 py-3 text-sm font-sans normal-case rounded-lg focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="zip" className="text-foreground/70">Postal / ZIP Code</label>
                <input
                  id="zip"
                  type="text"
                  placeholder="800001"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="w-full border border-border bg-background/50 px-4 py-3 text-sm font-sans normal-case rounded-lg focus:outline-none focus:border-accent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="glass-panel p-6 md:p-8 rounded-xl border relative">
            <div className="absolute inset-2 border border-foreground/5 rounded-lg pointer-events-none" />

            <h3 className="font-serif text-xl font-bold text-foreground border-b border-border pb-4 mb-6 flex items-center gap-2 relative z-10">
              <CreditCard className="h-5 w-5 text-accent" /> Razorpay Secure Payment
            </h3>

            <p className="relative z-10 text-sm text-foreground/65 leading-relaxed">
              Payment opens in Razorpay Checkout. UPI, cards, wallets, and netbanking are handled by Razorpay; this website never stores card details.
            </p>
          </div>

          {/* Payment Form */}
          <div className="glass-panel p-6 md:p-8 rounded-xl border relative">
            <div className="absolute inset-2 border border-foreground/5 rounded-lg pointer-events-none" />

            <h3 className="font-serif text-xl font-bold text-foreground border-b border-border pb-4 mb-6 flex items-center gap-2 relative z-10">
              <CreditCard className="h-5 w-5 text-accent" /> Razorpay Secure Payment
            </h3>

            <p className="relative z-10 text-sm text-foreground/65 leading-relaxed">
              Payment opens in Razorpay Checkout. UPI, cards, wallets, and netbanking are handled by Razorpay; this website never stores card details.
            </p>
          </div>
        </div>

        {/* Right Summary panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-xl border shadow-md relative">
            <div className="absolute inset-2 border border-foreground/5 rounded-lg pointer-events-none" />

            <h3 className="font-serif text-xl font-bold text-foreground border-b border-border pb-4 mb-4 relative z-10">
              Bag Summary
            </h3>

            {/* Cart Items list */}
            <ul className="divide-y divide-border relative z-10 max-h-48 overflow-y-auto mb-4 font-sans text-xs">
              {cart.map((item) => {
                const price = item.salePrice ?? item.price;
                return (
                  <li key={item.productId} className="py-3 flex justify-between items-center gap-3">
                    <span className="text-foreground font-semibold truncate max-w-[150px]">
                      {item.title}
                    </span>
                    <span className="text-foreground/60">
                      Qty: {item.quantity}
                    </span>
                    <span className="text-foreground font-bold">
                      ₹{(price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Calculations review */}
            <div className="space-y-3.5 border-t border-border pt-4 text-xs font-sans relative z-10">
              <div className="flex justify-between text-foreground/85">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-foreground/85">
                <span>Estimated Tax (8%)</span>
                <span>₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-foreground/85">
                <span>Shipping Charges</span>
                <span>{shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`}</span>
              </div>
              <div className="border-t border-border pt-3.5 flex justify-between text-sm font-bold text-foreground">
                <span>Acquisition Cost</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Guarantee badge */}
            <div className="flex gap-2 items-start mt-6 p-3 bg-foreground/5 border border-border rounded-lg relative z-10 text-[10px] font-sans">
              <ShieldCheck className="h-4.5 w-4.5 text-madhubani-terracotta dark:text-madhubani-mustard flex-shrink-0" />
              <p className="text-foreground/75 leading-normal">
                Verifying certificates and securing safe package delivery. All data is protected.
              </p>
            </div>

            {/* Confirm button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="clickable w-full py-4 bg-madhubani-terracotta dark:bg-madhubani-mustard text-white dark:text-madhubani-soot rounded-lg font-serif text-sm font-bold tracking-widest hover:opacity-90 transition-opacity shadow-lg mt-6 flex justify-center items-center gap-2 relative z-10 disabled:opacity-60"
            >
              {isSubmitting ? 'OPENING RAZORPAY...' : 'PAY NOW'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

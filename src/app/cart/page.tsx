'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import { Trash2, ShoppingBag, ArrowLeft, ArrowRight, Tag, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const { cart, removeFromCart, updateCartQuantity, clearCart } = useAppStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0); // percentage discount
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-madhubani-terracotta border-t-transparent" />
      </div>
    );
  }

  // Calculate pricing sums
  const subtotal = cart.reduce((acc, item) => {
    const price = item.salePrice ?? item.price;
    return acc + price * item.quantity;
  }, 0);

  const discountAmount = subtotal * (couponDiscount / 100);
  const taxedSubtotal = subtotal - discountAmount;
  const tax = taxedSubtotal * 0.08; // 8% tax rate
  const shipping = subtotal > 0 && taxedSubtotal < 250 ? 20.00 : 0.00; // Free shipping over $250
  const total = taxedSubtotal + tax + shipping;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);

    const code = couponCode.trim().toUpperCase();

    if (code === 'WELCOME10') {
      setCouponDiscount(10);
      setAppliedCoupon('WELCOME10 (10% OFF)');
      setCouponCode('');
    } else if (code === 'HERITAGE20') {
      setCouponDiscount(20);
      setAppliedCoupon('HERITAGE20 (20% OFF)');
      setCouponCode('');
    } else {
      setCouponError('Invalid coupon code. Try WELCOME10 or HERITAGE20.');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponDiscount(0);
    setAppliedCoupon(null);
  };

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
        <div className="p-6 rounded-full bg-foreground/5 mb-6">
          <ShoppingBag className="h-12 w-12 text-foreground/40" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-foreground">Your Collection is Empty</h2>
        <p className="text-sm text-foreground/60 mt-3 max-w-sm leading-relaxed">
          It seems you haven&apos;t added any traditional Mithila paintings to your acquisition bag yet.
        </p>
        <Link
          href="/gallery"
          className="clickable mt-8 inline-flex items-center gap-2 rounded-lg bg-madhubani-terracotta dark:bg-madhubani-mustard px-6 py-3 font-serif text-sm font-semibold text-white dark:text-madhubani-soot hover:opacity-90 transition-opacity shadow-md"
        >
          <ArrowLeft className="h-4 w-4" /> BROWSE THE EXHIBITIONS
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-6 py-12 md:py-20">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">Acquisition Bag</h1>
        <p className="text-sm text-foreground/60 mt-2">
          Verify selected paintings and prepare certificate allocations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="border border-border rounded-xl overflow-hidden bg-card/25 backdrop-blur-sm shadow-sm">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <span className="font-sans text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                {cart.length} Paintings Selected
              </span>
              <button
                onClick={clearCart}
                className="clickable text-xs text-madhubani-vermillion hover:underline flex items-center gap-1.5 font-sans font-semibold"
              >
                Clear Cart
              </button>
            </div>

            <ul className="divide-y divide-border">
              <AnimatePresence>
                {cart.map((item) => {
                  const price = item.salePrice ?? item.price;
                  return (
                    <motion.li
                      key={item.productId}
                      exit={{ opacity: 0, height: 0, padding: 0 }}
                      className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between overflow-hidden"
                    >
                      {/* Left Block (Thumbnail + Name) */}
                      <div className="flex gap-4 items-center">
                        <div className="madhubani-border relative h-20 w-20 flex-shrink-0 bg-card overflow-hidden">
                          <Image
                            src={item.featuredImage}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-foreground hover:text-accent transition-colors">
                            <Link href={`/gallery/${item.productId}`}>
                              {item.title}
                            </Link>
                          </h3>
                          <span className="font-sans text-xs text-foreground/60 mt-1 block">
                            SKU: {item.productId.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Right Block (Quantities + Price) */}
                      <div className="flex items-center justify-between w-full sm:w-auto gap-8 border-t sm:border-t-0 pt-4 sm:pt-0">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden">
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                            className="clickable px-3 py-1.5 hover:bg-foreground/5 text-foreground/75"
                          >
                            -
                          </button>
                          <span className="px-3 font-sans text-xs font-semibold text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                            className="clickable px-3 py-1.5 hover:bg-foreground/5 text-foreground/75"
                            disabled={item.quantity >= item.stock}
                          >
                            +
                          </button>
                        </div>

                        {/* Totals */}
                        <div className="text-right">
                          <span className="font-serif text-base font-bold text-foreground block">
                            ${(price * item.quantity).toFixed(2)}
                          </span>
                          {item.quantity > 1 && (
                            <span className="font-sans text-[10px] text-foreground/50 block mt-0.5">
                              (${price.toFixed(2)} each)
                            </span>
                          )}
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="clickable p-2 hover:bg-madhubani-vermillion/10 text-foreground/60 hover:text-madhubani-vermillion rounded-lg transition-colors"
                          aria-label="Remove painting"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </div>

          {/* Back to Gallery */}
          <Link
            href="/gallery"
            className="clickable inline-flex items-center gap-2 text-xs font-bold text-foreground/70 hover:text-foreground font-sans uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" /> Continue browsing paintings
          </Link>
        </div>

        {/* Checkout summary panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-xl border shadow-md flex flex-col gap-6 relative">
            <div className="absolute inset-2 border border-foreground/5 rounded-lg pointer-events-none" />

            <h3 className="font-serif text-xl font-bold text-foreground border-b border-border pb-4 relative z-10">
              Order Summary
            </h3>

            {/* Price values */}
            <div className="space-y-3.5 text-sm font-sans relative z-10">
              <div className="flex justify-between text-foreground/80">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-madhubani-forest font-semibold">
                  <span className="flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5" /> Coupon Discount
                  </span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-foreground/80">
                <span>Estimated Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-foreground/80">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
              </div>

              <div className="border-t border-border pt-4 flex justify-between text-base font-bold text-foreground">
                <span>Estimated Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Coupon Code Input */}
            <div className="border-t border-border pt-4 relative z-10">
              {appliedCoupon ? (
                <div className="p-3.5 bg-madhubani-forest/10 border border-madhubani-forest/20 text-madhubani-forest rounded-lg flex items-center justify-between text-xs font-sans">
                  <span className="font-semibold flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" /> {appliedCoupon}
                  </span>
                  <button onClick={handleRemoveCoupon} className="hover:underline text-foreground/60 font-bold">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <label htmlFor="coupon" className="text-xs font-semibold text-foreground/60 uppercase tracking-wider block">
                    Promo / Gift Code
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="coupon"
                      placeholder="WELCOME10 / HERITAGE20"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full border border-border bg-background/50 px-4 py-2.5 text-xs font-sans rounded-l-md focus:outline-none focus:border-accent"
                    />
                    <button type="submit" className="clickable bg-foreground text-background px-4 py-2.5 text-xs font-semibold rounded-r-md hover:opacity-90">
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <span className="text-[10px] font-semibold text-madhubani-vermillion block mt-1">
                      {couponError}
                    </span>
                  )}
                </form>
              )}
            </div>

            {/* Proceed to checkout */}
            <Link
              href="/checkout"
              className="clickable w-full py-4 bg-madhubani-terracotta dark:bg-madhubani-mustard text-white dark:text-madhubani-soot text-center rounded-lg font-serif text-sm font-bold tracking-widest hover:opacity-90 transition-opacity shadow-lg flex justify-center items-center gap-2 relative z-10"
            >
              PROCEED TO ACQUISITION <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

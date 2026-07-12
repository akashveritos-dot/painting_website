'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface FeedbackDetail {
  type: 'cart' | 'wishlist';
  title: string;
  image?: string;
}

interface FeedbackEvent extends Event {
  detail?: FeedbackDetail;
}

type Toast = FeedbackDetail & { id: number };

export default function ActionFeedback() {
  const [toast, setToast] = useState<Toast | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handler = (event: FeedbackEvent) => {
      if (!event.detail) return;
      setToast({ id: Date.now(), ...event.detail });
    };
    window.addEventListener('heritage-feedback', handler);
    return () => window.removeEventListener('heritage-feedback', handler);
  }, []);

  // Single auto-dismiss timer keyed to the current toast — a new toast resets it,
  // so rapid adds can't clear a newer toast early.
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const isCart = toast?.type === 'cart';
  const Icon = isCart ? ShoppingBag : Heart;

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.94 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.94 }}
          transition={reduceMotion ? { duration: 0.15 } : { type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2"
        >
          <div className="glass-panel relative overflow-hidden rounded-xl border p-4 shadow-2xl">
            {/* Madhubani inner border accent */}
            <div className="pointer-events-none absolute inset-1.5 rounded-lg border border-foreground/5" />

            <div className="relative flex items-center gap-3">
              {/* Product thumbnail, or an icon medallion if none */}
              {toast.image ? (
                <div className="madhubani-border relative h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-card">
                  <Image src={toast.image} alt={toast.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-madhubani-terracotta text-white dark:bg-madhubani-mustard dark:text-madhubani-soot">
                  <Icon className="h-5 w-5" />
                </div>
              )}

              <div className="min-w-0 flex-grow">
                <p className="flex items-center gap-1.5 font-serif text-sm font-bold">
                  <Check className="h-3.5 w-3.5 text-madhubani-forest" />
                  {isCart ? 'Added to Cart' : 'Saved to Wishlist'}
                </p>
                <p className="truncate text-xs text-foreground/65">{toast.title}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="relative mt-3 flex items-center gap-2 border-t border-border pt-3">
              <Link
                href={isCart ? '/cart' : '/wishlist'}
                onClick={() => setToast(null)}
                className="clickable flex-1 rounded-lg border border-border py-2 text-center text-[11px] font-bold uppercase tracking-wider text-foreground/75 transition-colors hover:bg-foreground/5"
              >
                {isCart ? 'View Cart' : 'View Wishlist'}
              </Link>
              {isCart && (
                <Link
                  href="/checkout"
                  onClick={() => setToast(null)}
                  className="clickable flex flex-1 items-center justify-center gap-1 rounded-lg bg-madhubani-terracotta py-2 text-center text-[11px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 dark:bg-madhubani-mustard dark:text-madhubani-soot"
                >
                  Checkout <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

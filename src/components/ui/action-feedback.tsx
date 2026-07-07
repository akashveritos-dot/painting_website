'use client';

import { useEffect, useState } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface FeedbackEvent extends Event {
  detail?: {
    type: 'cart' | 'wishlist';
    title: string;
  };
}

export default function ActionFeedback() {
  const [message, setMessage] = useState<{ id: number; type: 'cart' | 'wishlist'; title: string } | null>(null);

  useEffect(() => {
    const handler = (event: FeedbackEvent) => {
      if (!event.detail) return;
      setMessage({ id: Date.now(), ...event.detail });
    };

    window.addEventListener('heritage-feedback', handler);
    return () => window.removeEventListener('heritage-feedback', handler);
  }, []);

  const Icon = message?.type === 'wishlist' ? Heart : ShoppingBag;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          onAnimationComplete={() => {
            window.setTimeout(() => setMessage(null), 1800);
          }}
          className="pointer-events-none fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2"
        >
          <div className="glass-panel rounded-xl border p-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-madhubani-terracotta text-white dark:bg-madhubani-mustard dark:text-madhubani-soot">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-serif text-base font-bold">
                  {message.type === 'cart' ? 'Added to Cart' : 'Saved to Wishlist'}
                </p>
                <p className="truncate text-xs text-foreground/65">{message.title}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

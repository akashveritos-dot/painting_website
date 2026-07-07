'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import { Trash2, Heart, ArrowLeft, ShoppingCart, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const { wishlist, removeFromWishlist, addToCart } = useAppStore();

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

  if (wishlist.length === 0) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
        <div className="p-6 rounded-full bg-foreground/5 mb-6">
          <Heart className="h-12 w-12 text-foreground/40" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-foreground">Your Favorites is Empty</h2>
        <p className="text-sm text-foreground/60 mt-3 max-w-sm leading-relaxed">
          You haven&apos;t marked any Madhubani masterpieces as your favorites yet.
        </p>
        <Link
          href="/gallery"
          className="clickable mt-8 inline-flex items-center gap-2 rounded-lg bg-madhubani-terracotta dark:bg-madhubani-mustard px-6 py-3 font-serif text-sm font-semibold text-white dark:text-madhubani-soot hover:opacity-90 transition-opacity shadow-md"
        >
          <ArrowLeft className="h-4 w-4" /> BROWSE THE SHOWROOM
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-6 py-12 md:py-20">
      <div className="mb-12">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">Curated Wishlist</h1>
        <p className="text-sm text-foreground/60 mt-2">
          Your saved selections of hand-painted Mithila art.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {wishlist.map((item) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              key={item.productId}
              className="glass-panel rounded-xl border overflow-hidden shadow-sm flex flex-col relative"
            >
              <div className="absolute inset-2 border border-foreground/5 rounded-lg pointer-events-none" />

              {/* Thumbnail */}
              <div className="relative aspect-[4/3] w-full p-4 bg-linen-light dark:bg-linen-dark border-b border-border">
                <div className="madhubani-border relative w-full h-full rounded overflow-hidden bg-card">
                  <Image
                    src={item.featuredImage}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Info & buttons */}
              <div className="p-5 flex-grow flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                  <span className="font-serif text-base font-bold text-madhubani-terracotta dark:text-madhubani-mustard block mt-1.5">
                    ₹{(item.salePrice ?? item.price).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => {
                      addToCart({
                        productId: item.productId,
                        title: item.title,
                        price: item.price,
                        salePrice: item.salePrice,
                        featuredImage: item.featuredImage,
                        stock: 5 // Default fallback stock
                      }, 1);
                      removeFromWishlist(item.productId);
                    }}
                    className="clickable btn-heritage flex-grow py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    MOVE TO BAG
                  </button>

                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="clickable p-2.5 border border-border hover:bg-madhubani-vermillion/10 text-foreground/60 hover:text-madhubani-vermillion rounded-lg transition-colors"
                    aria-label="Delete from favorites"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/gallery"
          className="clickable inline-flex items-center gap-2 text-xs font-bold text-foreground/60 hover:text-foreground font-sans uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" /> Return to the art gallery
        </Link>
      </div>
    </div>
  );
}

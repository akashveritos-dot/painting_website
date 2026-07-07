'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { DEFAULT_HOME_CONTENT, HomeContent } from '@/lib/site-content';
import { ShoppingCart, Heart, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  price: number;
  salePrice: number | null;
  featuredImage: string;
  categoryId: string;
  categoryName: string;
  stock: number;
}

function toCartItem(product: Product) {
  return {
    productId: product.id,
    title: product.title,
    price: product.price,
    salePrice: product.salePrice,
    featuredImage: product.featuredImage,
    stock: product.stock,
  };
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [homeContent, setHomeContent] = useState<HomeContent>(DEFAULT_HOME_CONTENT);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const { addToCart, addToWishlist, wishlist } = useAppStore();

  // Fetch products from our API on mount
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.products) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.error('Failed to load products:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/site-content')
      .then((res) => res.json())
      .then((data) => {
        if (data?.home) setHomeContent(data.home);
      })
      .catch((err) => console.error('Failed to load site content:', err));
  }, []);

  const filteredProducts = products.filter((p) => {
    if (filter === 'all') return true;
    return p.categoryId === filter;
  });

  return (
    <div className="relative w-full">
      {/* 1. HERO SECTION */}
      <section className="relative flex min-h-[90vh] flex-col justify-center overflow-hidden px-6 py-20 md:px-12 museum-glow">
        <div className="mithila-ambient" aria-hidden="true">
          <span className="mithila-symbol mithila-symbol--large" />
          <span className="mithila-symbol mithila-symbol--small" />
        </div>
        <div className="mx-auto max-w-7xl w-full grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          
          <div className="md:col-span-7 flex flex-col items-start space-y-6 z-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-madhubani-terracotta/20 bg-madhubani-terracotta/5 text-madhubani-terracotta dark:text-madhubani-mustard dark:border-madhubani-mustard/20 text-xs font-semibold uppercase tracking-widest"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {homeContent.heroEyebrow}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-wide leading-tight text-foreground"
            >
              {homeContent.heroTitleLine1} <br />
              <span className="text-gold-gradient">{homeContent.heroTitleAccent}</span> <br />
              {homeContent.heroTitleLine3}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="font-sans text-base md:text-lg text-foreground/75 leading-relaxed max-w-xl"
            >
              {homeContent.heroDescription}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <a
                href="#exhibition"
                className="clickable inline-flex items-center justify-center rounded-lg bg-madhubani-terracotta dark:bg-madhubani-mustard px-7 py-4 font-serif text-sm font-semibold tracking-wider text-white dark:text-madhubani-soot hover:opacity-90 transition-all shadow-lg gap-2"
              >
                {homeContent.heroPrimaryCta} <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/gallery"
                className="clickable inline-flex items-center justify-center rounded-lg border border-border bg-card/50 backdrop-blur-sm px-7 py-4 font-sans text-sm font-semibold tracking-wide hover:bg-card transition-all"
              >
                {homeContent.heroSecondaryCta}
              </Link>
            </motion.div>
          </div>

          {/* Hero Visual Showcase */}
          <div className="md:col-span-5 flex justify-center z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="madhubani-border relative w-full max-w-sm aspect-[4/5] rounded-lg overflow-hidden shadow-2xl bg-card"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
              
              <Image
                src={homeContent.heroImage}
                alt={homeContent.heroImageAlt}
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
                priority
              />

              <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
                <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-semibold text-madhubani-mustard">
                  {homeContent.heroImageLabel}
                </span>
                <h3 className="font-serif text-xl font-bold mt-1">{homeContent.heroImageTitle}</h3>
                <p className="font-sans text-xs text-white/80 mt-1">{homeContent.heroImageDescription}</p>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* 2. ARTISAN PHILOSOPHY */}
      <section className="bg-card/20 py-20 border-y border-border">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col gap-3">
              <span className="font-serif text-lg font-bold text-madhubani-terracotta dark:text-madhubani-mustard">01. Organic Pigments</span>
              <h3 className="font-serif text-xl font-bold text-foreground">Natural Raw Colors</h3>
              <p className="font-sans text-sm text-foreground/75 leading-relaxed">
                Colors are processed by hand from nature: deep blue from indigo, vermillion red from local minerals, black from soot, and golden yellow from turmeric juices.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-serif text-lg font-bold text-madhubani-terracotta dark:text-madhubani-mustard">02. Double Border Framing</span>
              <h3 className="font-serif text-xl font-bold text-foreground">Double Line Boundaries</h3>
              <p className="font-sans text-sm text-foreground/75 leading-relaxed">
                A hallmark of Mithila painting. The outlines of all figures are drawn twice, representing both outer constraints and inner spirits, detailed with flower chains.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-serif text-lg font-bold text-madhubani-terracotta dark:text-madhubani-mustard">03. Kachni & Bharni Styles</span>
              <h3 className="font-serif text-xl font-bold text-foreground">Hatching vs. Filling</h3>
              <p className="font-sans text-sm text-foreground/75 leading-relaxed">
                Choose between Kachni—intricate monochromatic lines and fine hatching, and Bharni—vibrant, solid filled blocks of traditional mythic narratives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EXHIBITION CATALOG SECTION */}
      <section id="exhibition" className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                {homeContent.exhibitionTitle}
              </h2>
              <p className="text-sm text-foreground/60 mt-2 max-w-md">
                {homeContent.exhibitionDescription}
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {['all', 'bharni', 'kachni'].map((style) => (
                <button
                  key={style}
                  onClick={() => setFilter(style)}
                  className={`clickable px-5 py-2.5 rounded-lg text-xs font-sans font-semibold uppercase tracking-wider transition-all duration-300 ${
                    filter === style
                      ? 'bg-madhubani-terracotta dark:bg-madhubani-mustard text-white dark:text-madhubani-soot shadow-md'
                      : 'border border-border hover:bg-foreground/5 text-foreground/75'
                  }`}
                >
                  {style === 'all' ? 'All Styles' : `${style} Style`}
                </button>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {[1, 2].map((i) => (
                <div key={i} className="glass-panel rounded-2xl aspect-[4/5] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => {
                  const inWishlist = wishlist.some((item) => item.productId === product.id);

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      key={product.id}
                      className="glass-panel glass-panel-hover flex flex-col rounded-2xl overflow-hidden shadow-xl border relative"
                    >
                      {/* Image Frame */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-linen-light dark:bg-linen-dark border-b border-border p-4">
                        <div className="madhubani-border relative w-full h-full rounded-md overflow-hidden bg-card">
                          <Image
                            src={product.featuredImage}
                            alt={product.title}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        {/* Category Tag */}
                        <span className="absolute top-8 left-8 z-10 px-3 py-1 bg-foreground text-background text-[10px] font-sans font-bold uppercase tracking-wider rounded-md">
                          {product.categoryName}
                        </span>

                        {/* Wishlist Button */}
                        <button
                          onClick={() => addToWishlist({
                            productId: product.id,
                            title: product.title,
                            price: product.price,
                            salePrice: product.salePrice,
                            featuredImage: product.featuredImage
                          })}
                          className={`clickable absolute top-8 right-8 z-10 p-2.5 rounded-full border shadow-md backdrop-blur-md transition-all duration-300 ${
                            inWishlist
                              ? 'bg-madhubani-vermillion border-madhubani-vermillion text-white'
                              : 'bg-card/80 border-border text-foreground/80 hover:text-madhubani-vermillion'
                          }`}
                          aria-label="Add to wishlist"
                        >
                          <Heart className="h-4.5 w-4.5" fill={inWishlist ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      {/* Info Panel */}
                      <div className="p-6 flex flex-col flex-grow justify-between gap-4">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-serif text-2xl font-bold tracking-wide text-foreground">
                              {product.title}
                            </h3>
                            <div className="flex flex-col items-end">
                              {product.salePrice ? (
                                <>
                                  <span className="font-serif text-xl font-bold text-madhubani-terracotta dark:text-madhubani-mustard">
                                    ${product.salePrice.toFixed(2)}
                                  </span>
                                  <span className="font-sans text-xs text-foreground/45 line-through">
                                    ${product.price.toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="font-serif text-xl font-bold text-foreground">
                                  ${product.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="font-sans text-sm text-foreground/75 mt-3 leading-relaxed">
                            {product.shortDescription}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
                          <span className="font-sans text-xs text-foreground/50 font-semibold tracking-wide">
                            {product.stock > 0 ? `${product.stock} pieces remaining` : 'Out of Stock'}
                          </span>

                          <button
                            onClick={() => addToCart(toCartItem(product), 1)}
                            disabled={product.stock <= 0}
                            className="clickable btn-heritage inline-flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            ADD TO COLLECTION
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

        </div>
      </section>

      {/* 4. STATISTICS COUNTER */}
      <section className="bg-madhubani-terracotta text-white dark:bg-linen-dark dark:border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
          <div className="flex flex-col gap-1">
            <span className="font-serif text-4xl md:text-5xl font-bold text-madhubani-mustard">20+</span>
            <span className="font-sans text-xs uppercase tracking-widest text-white/70">Master Artisans</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-serif text-4xl md:text-5xl font-bold text-madhubani-mustard">100%</span>
            <span className="font-sans text-xs uppercase tracking-widest text-white/70">Organic Pigments</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-serif text-4xl md:text-5xl font-bold text-madhubani-mustard">15+</span>
            <span className="font-sans text-xs uppercase tracking-widest text-white/70">Villages Supported</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-serif text-4xl md:text-5xl font-bold text-madhubani-mustard">1,200+</span>
            <span className="font-sans text-xs uppercase tracking-widest text-white/70">Paintings Shipped</span>
          </div>
        </div>
      </section>

      {/* 5. TRUST BANNER */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-xl text-center flex flex-col items-center gap-4">
          <ShieldCheck className="h-10 w-10 text-madhubani-terracotta dark:text-madhubani-mustard" />
          <h2 className="font-serif text-2xl font-bold text-foreground">{homeContent.trustTitle}</h2>
          <p className="font-sans text-sm text-foreground/75 leading-relaxed">
            {homeContent.trustDescription}
          </p>
        </div>
      </section>
    </div>
  );
}

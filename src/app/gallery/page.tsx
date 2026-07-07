'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Search, SlidersHorizontal, Heart, ShoppingCart } from 'lucide-react';

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

function GalleryFallback() {
  return (
    <div className="mx-auto max-w-7xl w-full px-6 py-12 md:py-20">
      <div className="mb-12 text-center max-w-xl mx-auto">
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground">Exhibition Showroom</h1>
        <p className="text-sm text-foreground/60 mt-3 leading-relaxed">
          Acquire signed heritage paintings from Mithila artisans. Hand-painted with natural plant dyes on handmade canvas sheets.
        </p>
      </div>
      <div className="glass-panel p-4 md:p-6 rounded-xl border mb-12 shadow-sm h-20 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {[1, 2].map((i) => (
          <div key={i} className="glass-panel aspect-[4/5] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function GalleryContent() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('category') || 'all';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(catParam);
  const [sortBy, setSortBy] = useState('featured');

  const { addToCart, addToWishlist, wishlist } = useAppStore();

  useEffect(() => {
    setSelectedCategory(catParam);
  }, [catParam]);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.products) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.error('Error fetching gallery products:', err))
      .finally(() => setLoading(false));
  }, []);

  // Filter and sort items
  const processedProducts = products
    .filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const priceA = a.salePrice ?? a.price;
      const priceB = b.salePrice ?? b.price;

      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      return 0; // Default order
    });

  return (
    <div className="mx-auto max-w-7xl w-full px-6 py-12 md:py-20">
      {/* Title */}
      <div className="mb-12 text-center max-w-xl mx-auto">
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground">Exhibition Showroom</h1>
        <p className="text-sm text-foreground/60 mt-3 leading-relaxed">
          Acquire signed heritage paintings from Mithila artisans. Hand-painted with natural plant dyes on handmade canvas sheets.
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel p-4 md:p-6 rounded-xl border mb-12 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/45" />
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border bg-background/50 rounded-lg focus:outline-none focus:border-accent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {['all', 'bharni', 'kachni'].map((style) => (
            <button
              key={style}
              onClick={() => setSelectedCategory(style)}
              className={`px-4 py-2 rounded-lg text-xs font-sans font-semibold uppercase tracking-wider transition-all ${
                selectedCategory === style
                  ? 'bg-madhubani-terracotta dark:bg-madhubani-mustard text-white dark:text-madhubani-soot'
                  : 'hover:bg-foreground/5 text-foreground/75'
              }`}
            >
              {style === 'all' ? 'All Styles' : style}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <SlidersHorizontal className="h-4 w-4 text-foreground/60" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-border bg-background/50 px-3 py-2 text-xs font-sans rounded-lg focus:outline-none focus:border-accent"
          >
            <option value="featured">Featured Collections</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {[1, 2].map((i) => (
            <div key={i} className="glass-panel aspect-[4/5] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : processedProducts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <p className="font-sans text-sm text-foreground/50">No paintings match your current search queries.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-4 text-xs font-bold text-madhubani-terracotta hover:underline uppercase tracking-wide"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <AnimatePresence mode="popLayout">
            {processedProducts.map((product) => {
              const inWishlist = wishlist.some((item) => item.productId === product.id);
              const displayPrice = product.salePrice ?? product.price;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  key={product.id}
                  className="glass-panel glass-panel-hover flex flex-col rounded-xl overflow-hidden shadow-md border relative"
                >
                  <div className="absolute inset-2 border border-foreground/5 rounded-lg pointer-events-none" />

                  {/* Image wrapper */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-linen-light dark:bg-linen-dark border-b border-border p-4">
                    <div className="madhubani-border relative w-full h-full rounded-md overflow-hidden bg-card">
                      <Image
                        src={product.featuredImage}
                        alt={product.title}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Category tag */}
                    <span className="absolute top-8 left-8 z-10 px-3 py-1 bg-foreground text-background text-[10px] font-sans font-bold uppercase tracking-wider rounded-md">
                      {product.categoryName}
                    </span>

                    {/* Blinking Sale Tag */}
                    {product.salePrice && (
                      <span className="absolute top-8 right-24 z-10 px-2.5 py-1 bg-madhubani-vermillion text-white text-[9px] font-sans font-bold uppercase tracking-wider rounded-md sale-tag-blink">
                        SALE
                      </span>
                    )}

                    {/* Wishlist toggle */}
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
                    >
                      <Heart className="h-4 w-4" fill={inWishlist ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Details block */}
                  <div className="p-6 flex flex-col flex-grow justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-serif text-xl font-bold tracking-wide text-foreground">
                          <Link href={`/gallery/${product.slug}`} className="hover:text-accent transition-colors">
                            {product.title}
                          </Link>
                        </h3>
                        <div className="text-right">
                          {product.salePrice ? (
                            <>
                              <span className="font-serif text-lg font-bold text-madhubani-terracotta dark:text-madhubani-mustard block">
                                ₹{product.salePrice.toLocaleString('en-IN')}
                              </span>
                              <span className="font-sans text-[10px] text-foreground/45 line-through block mt-0.5">
                                ₹{product.price.toLocaleString('en-IN')}
                              </span>
                            </>
                          ) : (
                            <span className="font-serif text-lg font-bold text-foreground block">
                              ₹{product.price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-sans text-xs text-foreground/75 mt-3 leading-relaxed">
                        {product.shortDescription}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border gap-4">
                      <span className="font-sans text-[10px] text-foreground/50 uppercase tracking-wider font-semibold">
                        {product.stock > 0 ? `${product.stock} items remaining` : 'Sold out'}
                      </span>
                      <button
                        onClick={() => addToCart(toCartItem(product), 1)}
                        disabled={product.stock <= 0}
                        className="clickable btn-heritage inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        ACQUIRE
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
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<GalleryFallback />}>
      <GalleryContent />
    </Suspense>
  );
}

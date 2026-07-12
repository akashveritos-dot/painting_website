'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { ShoppingCart, Heart, Shield, Award, Sparkles, ArrowLeft, ZoomIn, Star } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  userName: string | null;
}

function Stars({ value, className = 'h-4 w-4' }: { value: number; className?: string }) {
  return (
    <span className="inline-flex" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${className} ${n <= Math.round(value) ? 'fill-madhubani-mustard text-madhubani-mustard' : 'text-foreground/25'}`}
        />
      ))}
    </span>
  );
}

interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  price: number;
  salePrice: number | null;
  featuredImage: string;
  images?: string[];
  categoryId: string;
  categoryName: string;
  stock: number;
  sku: string;
  tags: string[];
}

export default function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState<'none' | 'black' | 'teak' | 'oak'>('none');
  const [selectedSize, setSelectedSize] = useState<'standard' | 'medium' | 'large'>('standard');
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewAvg, setReviewAvg] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const { addToCart, addToWishlist, wishlist, user } = useAppStore();

  const loadReviews = (productId: string) => {
    fetch(`/api/reviews?productId=${productId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setReviews(data.reviews || []);
          setReviewAvg(data.average || 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch(`/api/products?slug=${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then((data) => {
        if (data && data.product) {
          setProduct(data.product);
          setActiveImage(data.product.featuredImage);
          loadReviews(data.product.id);
          // Related: other published products in the same category.
          fetch(`/api/products?category=${data.product.categoryId}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((catData) => {
              if (catData?.products) {
                setRelated(catData.products.filter((p: Product) => p.id !== data.product.id).slice(0, 3));
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.error(err);
        router.push('/gallery');
      })
      .finally(() => setLoading(false));
  }, [slug, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-madhubani-terracotta border-t-transparent" />
      </div>
    );
  }

  if (!product) return null;

  // Frame Styling Map
  const frameClasses = {
    none: 'border border-foreground/20 p-2 shadow-lg',
    black: 'border-[16px] border-[#18181A] p-2 shadow-2xl ring-4 ring-[#18181A]/10',
    teak: 'border-[16px] border-[#8B4513] p-2 shadow-2xl ring-4 ring-[#8B4513]/10',
    oak: 'border-[16px] border-[#3E2723] p-2 shadow-2xl ring-4 ring-[#3E2723]/10',
  };

  // Size and frame are presentation choices only — the server prices strictly
  // from the DB product, so charging a client-invented upcharge would be a
  // silent mismatch. Priced variants would need a product_variants table.
  const sizeLabels = {
    standard: 'Standard (12" x 15")',
    medium: 'Gallery Medium (16" x 20")',
    large: 'Museum Large (20" x 24")',
  };

  const currentPrice = product.salePrice ?? product.price;
  const inWishlist = wishlist.some((item) => item.productId === product.id);
  const gallery = product.images && product.images.length > 0 ? product.images : [product.featuredImage];

  const handleAddSelection = () => {
    addToCart({
      productId: product.id,
      title: `${product.title} — ${sizeLabels[selectedSize]}${selectedFrame !== 'none' ? `, ${selectedFrame} frame` : ''}`,
      price: product.price,
      salePrice: product.salePrice,
      featuredImage: product.featuredImage,
      stock: product.stock,
    }, quantity);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, rating: reviewRating, comment: reviewComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');
      setReviewComment('');
      loadReviews(product.id);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl w-full px-6 py-12 md:py-20">
      
      {/* Back button */}
      <Link
        href="/gallery"
        className="clickable inline-flex items-center gap-2 text-xs font-bold text-foreground/60 hover:text-foreground font-sans uppercase tracking-wider mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Showroom
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left: Frame simulator */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex flex-col items-center justify-center p-6 bg-card/10 border border-border rounded-2xl relative min-h-[450px]">
            {/* Simulation canvas wrap */}
            <motion.div
              layout
              className={`transition-all duration-300 relative w-full max-w-[340px] aspect-[4/5] rounded bg-white ${frameClasses[selectedFrame]}`}
            >
              {/* Handmade paper texture overlay */}
              <div className="absolute inset-0 bg-radial-gradient(ellipse at center, transparent, rgba(0,0,0,0.05)) pointer-events-none z-10" />

              <div className="madhubani-border relative w-full h-full rounded overflow-hidden">
                <Image
                  src={activeImage || product.featuredImage}
                  alt={product.title}
                  fill
                  className="object-cover hover:scale-110 transition-transform duration-700 cursor-zoom-in"
                />
              </div>

              {/* Zoom Indicator */}
              <div className="absolute bottom-4 right-4 z-20 p-2 rounded-full bg-black/60 text-white backdrop-blur-md">
                <ZoomIn className="h-4.5 w-4.5" />
              </div>
            </motion.div>

            {/* Simulated shadow casting reflection */}
            <div className="h-2 w-72 rounded-full bg-black/10 blur-md mt-6" />
          </div>

          {/* Thumbnail gallery — only shown when the product has multiple images */}
          {gallery.length > 1 && (
            <div className="flex flex-wrap gap-3">
              {gallery.map((url) => (
                <button
                  key={url}
                  onClick={() => setActiveImage(url)}
                  className={`clickable relative h-20 w-20 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === url ? 'border-accent' : 'border-border hover:border-foreground/40'
                  }`}
                  aria-label="View image"
                >
                  <Image src={url} alt={product.title} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Framing Simulator Buttons */}
          <div className="glass-panel p-5 rounded-xl border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-3 flex items-center gap-1.5 font-sans">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Frame Simulator
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
              {[
                { id: 'none', name: 'Raw Canvas' },
                { id: 'black', name: 'Soot Black' },
                { id: 'teak', name: 'Heritage Teak' },
                { id: 'oak', name: 'Dark Oak' },
              ].map((frame) => (
                <button
                  key={frame.id}
                  onClick={() => setSelectedFrame(frame.id as any)}
                  className={`clickable py-3 rounded-lg border text-center font-sans tracking-wide transition-all ${
                    selectedFrame === frame.id
                      ? 'border-foreground bg-foreground text-background font-bold'
                      : 'border-border bg-background/50 hover:bg-card text-foreground/80'
                  }`}
                >
                  {frame.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Info + Actions */}
        <div className="lg:col-span-6 space-y-8">
          <div className="space-y-4">
            <span className="font-serif text-sm font-bold text-madhubani-terracotta dark:text-madhubani-mustard">
              {product.categoryName} Selection
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-wide text-foreground">
              {product.title}
            </h1>
            
            <div className="flex justify-between items-center py-2 border-y border-border">
              <span className="font-sans text-xs text-foreground/60">
                SKU: <span className="font-mono font-semibold uppercase">{product.sku}</span>
              </span>
              <div className="flex items-center gap-2">
                {product.salePrice ? (
                  <>
                    <span className="font-serif text-2xl font-bold text-madhubani-terracotta dark:text-madhubani-mustard">
                      ₹{currentPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="font-sans text-sm text-foreground/45 line-through">
                      (₹{product.price.toLocaleString('en-IN')})
                    </span>
                  </>
                ) : (
                  <span className="font-serif text-2xl font-bold text-foreground">
                    ₹{currentPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sizing variations (presentation preference — price is unchanged) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/60 font-sans">
              Select Dimensions
            </h4>
            <div className="space-y-2">
              {[
                { id: 'standard', name: 'Standard (12" x 15")', desc: 'Original size as drafted' },
                { id: 'medium', name: 'Gallery Medium (16" x 20")', desc: 'Double border expanded' },
                { id: 'large', name: 'Museum Large (20" x 24")', desc: 'Full custom sizing detail' },
              ].map((size) => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(size.id as any)}
                  className={`clickable w-full p-4 rounded-xl border flex items-center justify-between text-left transition-all ${
                    selectedSize === size.id
                      ? 'border-accent bg-accent/5'
                      : 'border-border bg-card/20 hover:bg-card/50'
                  }`}
                >
                  <div>
                    <span className="font-serif text-sm font-bold text-foreground block">{size.name}</span>
                    <span className="font-sans text-xs text-foreground/60 mt-0.5 block">{size.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity and Cart buttons */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Quantity */}
            <div className="flex items-center border border-border rounded-lg bg-card/30 overflow-hidden h-14">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="clickable px-4 py-2 hover:bg-foreground/5 text-foreground/75 font-semibold text-sm"
              >
                -
              </button>
              <span className="px-4 font-sans text-sm font-bold text-foreground">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="clickable px-4 py-2 hover:bg-foreground/5 text-foreground/75 font-semibold text-sm"
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddSelection}
              disabled={product.stock <= 0}
              className="clickable btn-heritage flex-grow min-w-[180px] h-14 rounded-lg flex justify-center items-center gap-2 font-serif text-sm tracking-widest font-semibold shadow-lg"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              ADD TO COLLECTION
            </button>

            {/* Add to wishlist */}
            <button
              onClick={() => addToWishlist({
                productId: product.id,
                title: product.title,
                price: product.price,
                salePrice: product.salePrice,
                featuredImage: product.featuredImage
              })}
              className={`clickable p-4.5 rounded-lg border h-14 flex items-center justify-center transition-all ${
                inWishlist
                  ? 'bg-madhubani-vermillion border-madhubani-vermillion text-white'
                  : 'border-border bg-card/30 text-foreground hover:text-madhubani-vermillion'
              }`}
              aria-label="Add to favorites"
            >
              <Heart className="h-5 w-5" fill={inWishlist ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Artisan & Certificate Seals */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="flex gap-2 items-start p-3.5 bg-card/10 border border-border rounded-xl">
              <Award className="h-5 w-5 text-madhubani-terracotta dark:text-madhubani-mustard mt-0.5" />
              <div>
                <span className="font-serif text-xs font-bold text-foreground block">Authenticity Certificate</span>
                <span className="font-sans text-[10px] text-foreground/60 mt-0.5 block">Signed seal by painter included</span>
              </div>
            </div>
            <div className="flex gap-2 items-start p-3.5 bg-card/10 border border-border rounded-xl">
              <Shield className="h-5 w-5 text-madhubani-terracotta dark:text-madhubani-mustard mt-0.5" />
              <div>
                <span className="font-serif text-xs font-bold text-foreground block">Patron Protection</span>
                <span className="font-sans text-[10px] text-foreground/60 mt-0.5 block">Organic pigment certification</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-bold text-foreground">The Narrative & Materials</h3>
            <p className="font-sans text-sm text-foreground/75 leading-relaxed">
              {product.longDescription}
            </p>
          </div>

        </div>

      </div>

      {/* Customer reviews */}
      <div className="mt-20 border-t border-border pt-12">
        <div className="mb-8">
          <h2 className="font-serif text-2xl font-bold text-foreground">Patron Reviews</h2>
          {reviews.length > 0 ? (
            <div className="mt-2 flex items-center gap-2">
              <Stars value={reviewAvg} />
              <span className="text-sm text-foreground/70">
                {reviewAvg.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <p className="text-sm text-foreground/55 mt-2">No reviews yet — be the first to share your experience.</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">
          {/* Review list */}
          <div className="space-y-5">
            {reviews.map((r) => (
              <div key={r.id} className="glass-panel rounded-xl border p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-serif font-bold text-foreground">{r.userName || 'Art Patron'}</span>
                  <span className="text-xs text-foreground/50">{r.createdAt}</span>
                </div>
                <div className="mt-1">
                  <Stars value={r.rating} className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm text-foreground/75 mt-2 leading-relaxed">{r.comment}</p>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-sm text-foreground/50">This artwork has no reviews yet.</p>
            )}
          </div>

          {/* Submit form */}
          <div className="glass-panel rounded-xl border p-5">
            <h3 className="font-serif text-lg font-bold mb-3">Write a Review</h3>
            {user ? (
              <form onSubmit={submitReview} className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 block mb-1.5">Your Rating</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button type="button" key={n} onClick={() => setReviewRating(n)} aria-label={`${n} star`} className="clickable">
                        <Star className={`h-6 w-6 ${n <= reviewRating ? 'fill-madhubani-mustard text-madhubani-mustard' : 'text-foreground/25'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                  rows={4}
                  placeholder="Share your thoughts on this artwork..."
                  className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent"
                />
                {reviewError && <p className="text-xs font-semibold text-madhubani-vermillion">{reviewError}</p>}
                <button type="submit" disabled={submittingReview} className="clickable btn-heritage w-full rounded-lg py-3 text-xs font-bold disabled:opacity-60">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <p className="text-sm text-foreground/60">
                <Link href="/auth/login" className="text-accent font-semibold hover:underline">Sign in</Link> to leave a review.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Related products from the same collection */}
      {related.length > 0 && (
        <div className="mt-20 border-t border-border pt-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-8">More from this Collection</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {related.map((item) => {
              const price = item.salePrice ?? item.price;
              return (
                <Link
                  key={item.id}
                  href={`/gallery/${item.slug}`}
                  className="clickable glass-panel glass-panel-hover rounded-xl overflow-hidden border group"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-card">
                    <Image
                      src={item.featuredImage}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-sm font-bold text-foreground truncate">{item.title}</h3>
                    <span className="font-serif text-sm font-semibold text-madhubani-terracotta dark:text-madhubani-mustard mt-1 block">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

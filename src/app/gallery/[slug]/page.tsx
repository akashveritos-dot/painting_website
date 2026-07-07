'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { ShoppingCart, Heart, Shield, Award, Sparkles, ArrowLeft, ZoomIn } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  price: number;
  salePrice: number | null;
  featuredImage: string;
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
  const [loading, setLoading] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState<'none' | 'black' | 'teak' | 'oak'>('none');
  const [selectedSize, setSelectedSize] = useState<'standard' | 'medium' | 'large'>('standard');
  const [quantity, setQuantity] = useState(1);

  const { addToCart, addToWishlist, wishlist } = useAppStore();

  useEffect(() => {
    fetch(`/api/products?slug=${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then((data) => {
        if (data && data.product) {
          setProduct(data.product);
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

  // Size details & price adjustments
  const sizeLabels = {
    standard: 'Standard (12" x 15")',
    medium: 'Gallery Medium (16" x 20")',
    large: 'Museum Large (20" x 24")',
  };

  const sizeUpcharges = {
    standard: 0,
    medium: 4500.00,
    large: 9000.00,
  };

  const basePrice = product.salePrice ?? product.price;
  const currentPrice = basePrice + sizeUpcharges[selectedSize];
  const inWishlist = wishlist.some((item) => item.productId === product.id);

  const handleAddSelection = () => {
    // Generate adjusted product name containing size & frame
    const finalTitle = `${product.title} - ${sizeLabels[selectedSize]} (${selectedFrame !== 'none' ? `${selectedFrame} frame` : 'unframed'})`;
    
    addToCart({
      productId: product.id,
      title: finalTitle,
      price: currentPrice,
      salePrice: null, // Lock in the combined price
      featuredImage: product.featuredImage,
      stock: product.stock
    }, quantity);
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
                  src={product.featuredImage}
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

          {/* Framing Simulator Buttons */}
          <div className="glass-panel p-5 rounded-xl border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-3 flex items-center gap-1.5 font-sans">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Frame Simulator
            </h4>
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
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
                      (₹{(product.price + sizeUpcharges[selectedSize]).toLocaleString('en-IN')})
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

          {/* Sizing variations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/60 font-sans">
              Select Dimensions
            </h4>
            <div className="space-y-2">
              {[
                { id: 'standard', name: 'Standard (12" x 15")', desc: 'Original size as drafted' },
                { id: 'medium', name: 'Gallery Medium (16" x 20")', desc: 'Double border expanded', price: '+₹4,500' },
                { id: 'large', name: 'Museum Large (20" x 24")', desc: 'Full custom sizing detail', price: '+₹9,000' },
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
                  {size.price && (
                    <span className="font-serif text-sm font-semibold text-madhubani-terracotta dark:text-madhubani-mustard">
                      {size.price}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity and Cart buttons */}
          <div className="flex gap-4 items-center">
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
              className="clickable btn-heritage flex-grow h-14 rounded-lg flex justify-center items-center gap-2 font-serif text-sm tracking-widest font-semibold shadow-lg"
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
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  price: number;
  salePrice: number | null;
  stock: number;
  sku: string;
  featuredImage: string;
  categoryId: string;
  categoryName: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editor Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form inputs
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [category, setCategory] = useState('bharni');

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.products) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title);
    setSku(product.sku);
    setPrice(product.price.toString());
    setSalePrice(product.salePrice ? product.salePrice.toString() : '');
    setStock(product.stock.toString());
    setShortDescription(product.shortDescription);
    setLongDescription(product.longDescription || '');
    setCategory(product.categoryId);
    setModalOpen(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setTitle('');
    setSku(`MHG-${Math.floor(100 + Math.random() * 900)}-00${products.length + 1}`);
    setPrice('');
    setSalePrice('');
    setStock('');
    setShortDescription('');
    setLongDescription('');
    setCategory('bharni');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !price || !stock || !sku) {
      alert('Please fill in required fields');
      return;
    }

    const priceNum = parseFloat(price);
    const salePriceNum = salePrice ? parseFloat(salePrice) : null;
    const stockNum = parseInt(stock, 10);

    const categoryNames: Record<string, string> = {
      bharni: 'Bharni Style',
      kachni: 'Kachni Style',
      godna: 'Godna Style',
    };

    if (editingProduct) {
      // Update item locally
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              title,
              sku,
              price: priceNum,
              salePrice: salePriceNum,
              stock: stockNum,
              shortDescription,
              longDescription,
              categoryId: category,
              categoryName: categoryNames[category] || 'Heritage Art',
            }
          : p
      );
      setProducts(updated);
    } else {
      // Create new item locally
      const newItem: Product = {
        id: `prod-${Math.random().toString(36).substr(2, 9)}`,
        title,
        slug: title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        sku,
        price: priceNum,
        salePrice: salePriceNum,
        stock: stockNum,
        shortDescription,
        longDescription,
        categoryId: category,
        categoryName: categoryNames[category] || 'Heritage Art',
        featuredImage: category === 'kachni' ? '/assets/images/matsya_fish.png' : '/assets/images/celestial_peacock.png',
      };
      setProducts([...products, newItem]);
    }

    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to archive this painting from the active showroom?')) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Painting Inventory</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Manage painting details, descriptions, framing properties, and stock allocations.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="clickable btn-heritage inline-flex items-center gap-1.5 px-4.5 py-3 rounded-lg text-xs font-bold font-sans uppercase tracking-wider shadow-md"
        >
          <Plus className="h-4 w-4" /> Add Painting
        </button>
      </div>

      {/* Inventory table */}
      {loading ? (
        <div className="glass-panel h-64 rounded-xl border animate-pulse" />
      ) : (
        <div className="glass-panel rounded-xl border overflow-x-auto shadow-sm relative">
          <div className="absolute inset-2 border border-foreground/5 rounded-lg pointer-events-none" />
          <table className="w-full text-left border-collapse font-sans text-xs relative z-10">
            <thead>
              <tr className="border-b border-border bg-foreground/5 text-foreground/60 font-semibold uppercase tracking-wider">
                <th className="p-4">Painting Details</th>
                <th className="p-4">SKU / Code</th>
                <th className="p-4 text-right">Acquisition Cost</th>
                <th className="p-4 text-center">In Stock</th>
                <th className="p-4 text-center">Fulfillment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-foreground/5 transition-colors">
                  {/* Name + Thumbnail */}
                  <td className="p-4 flex items-center gap-3">
                    <div className="madhubani-border relative h-10 w-10 bg-card overflow-hidden flex-shrink-0">
                      <Image
                        src={product.featuredImage}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <span className="font-serif text-sm font-bold text-foreground block">
                        {product.title}
                      </span>
                      <span className="text-[10px] text-madhubani-terracotta dark:text-madhubani-mustard uppercase font-semibold tracking-wider mt-0.5 block">
                        {product.categoryName}
                      </span>
                    </div>
                  </td>

                  {/* SKU */}
                  <td className="p-4 font-mono font-semibold text-foreground/80 uppercase">
                    {product.sku}
                  </td>

                  {/* Pricing */}
                  <td className="p-4 text-right">
                    {product.salePrice ? (
                      <div>
                        <span className="font-semibold text-foreground block">${product.salePrice.toFixed(2)}</span>
                        <span className="text-[10px] text-foreground/45 line-through block mt-0.5">${product.price.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="font-semibold text-foreground block">${product.price.toFixed(2)}</span>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      product.stock > 0
                        ? 'bg-madhubani-forest/10 text-madhubani-forest'
                        : 'bg-madhubani-vermillion/10 text-madhubani-vermillion'
                    }`}>
                      {product.stock} items
                    </span>
                  </td>

                  {/* Action controls */}
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="clickable p-2 hover:bg-foreground/5 text-foreground/60 hover:text-foreground rounded-lg transition-colors"
                        aria-label="Edit product"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="clickable p-2 hover:bg-madhubani-vermillion/10 text-foreground/60 hover:text-madhubani-vermillion rounded-lg transition-colors"
                        aria-label="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-xl p-6 md:p-8 rounded-2xl shadow-2xl border relative max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute inset-2 border border-foreground/5 rounded-xl pointer-events-none" />

              <div className="flex justify-between items-center border-b border-border pb-4 mb-6 relative z-10">
                <h3 className="font-serif text-xl font-bold text-foreground">
                  {editingProduct ? 'Modify Painting Record' : 'Register New Painting'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="clickable p-1.5 hover:bg-foreground/5 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 relative z-10 text-xs font-semibold uppercase tracking-wide font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label htmlFor="modal-title" className="text-foreground/70">Painting Title</label>
                    <input
                      id="modal-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. The Celestial Peacock"
                      className="w-full border border-border bg-background/50 px-3.5 py-2.5 text-sm normal-case font-sans rounded-lg focus:outline-none focus:border-accent"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="modal-sku" className="text-foreground/70">Unique SKU Code</label>
                    <input
                      id="modal-sku"
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full border border-border bg-background/50 px-3.5 py-2.5 text-sm font-sans rounded-lg focus:outline-none focus:border-accent"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="modal-category" className="text-foreground/70">Mithila Painting Style</label>
                    <select
                      id="modal-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-border bg-background/50 px-3.5 py-2.5 text-sm font-sans rounded-lg focus:outline-none focus:border-accent"
                    >
                      <option value="bharni">Bharni Style (Solid Fill)</option>
                      <option value="kachni">Kachni Style (Line Hatching)</option>
                      <option value="godna">Godna Style (Tattoo Motifs)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="modal-price" className="text-foreground/70">Acquisition Price ($)</label>
                    <input
                      id="modal-price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="240.00"
                      className="w-full border border-border bg-background/50 px-3.5 py-2.5 text-sm font-sans rounded-lg focus:outline-none focus:border-accent"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="modal-sale" className="text-foreground/70">Promo / Sale Price ($)</label>
                    <input
                      id="modal-sale"
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="Leave blank for regular price"
                      className="w-full border border-border bg-background/50 px-3.5 py-2.5 text-sm font-sans rounded-lg focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="modal-stock" className="text-foreground/70">Fulfillment Stock Count</label>
                    <input
                      id="modal-stock"
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full border border-border bg-background/50 px-3.5 py-2.5 text-sm font-sans rounded-lg focus:outline-none focus:border-accent"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-short" className="text-foreground/70">Short Summary description</label>
                  <input
                    id="modal-short"
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Brief 1-sentence synopsis"
                    className="w-full border border-border bg-background/50 px-3.5 py-2.5 text-sm normal-case font-sans rounded-lg focus:outline-none focus:border-accent"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-long" className="text-foreground/70">Narrative & Mythological Details</label>
                  <textarea
                    id="modal-long"
                    rows={4}
                    value={longDescription}
                    onChange={(e) => setLongDescription(e.target.value)}
                    placeholder="Describe historical context, pigments used, and the story portrayed in the canvas..."
                    className="w-full border border-border bg-background/50 px-3.5 py-2.5 text-sm normal-case font-sans rounded-lg focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-border justify-end">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="clickable px-5 py-3 border border-border hover:bg-foreground/5 rounded-lg text-[10px] font-sans font-bold text-foreground/70 uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="clickable bg-madhubani-terracotta dark:bg-madhubani-mustard text-white dark:text-madhubani-soot px-6 py-3 rounded-lg text-[10px] font-serif font-bold uppercase tracking-wider"
                  >
                    Save Changes
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

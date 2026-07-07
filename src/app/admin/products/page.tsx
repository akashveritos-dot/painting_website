'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Archive, Edit, ImageIcon, Plus, Save, Search, X } from 'lucide-react';

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
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featuredImage: string;
  categoryId: string;
  categoryName: string;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  tags?: string[];
}

type ProductForm = Omit<Product, 'id' | 'categoryName' | 'tags'> & {
  id?: string;
  tags: string;
};

const CATEGORY_NAMES: Record<string, string> = {
  bharni: 'Bharni Style',
  kachni: 'Kachni Style',
  godna: 'Godna Style',
};

const EMPTY_FORM: ProductForm = {
  title: '',
  slug: '',
  shortDescription: '',
  longDescription: '',
  price: 0,
  salePrice: null,
  stock: 1,
  sku: '',
  status: 'PUBLISHED',
  featuredImage: '',
  categoryId: 'bharni',
  featured: true,
  newArrival: false,
  bestSeller: false,
  tags: '',
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toForm(product: Product): ProductForm {
  return {
    ...product,
    tags: product.tags?.join(', ') || '',
    status: product.status || 'PUBLISHED',
    featured: !!product.featured,
    newArrival: !!product.newArrival,
    bestSeller: !!product.bestSeller,
  };
}

function toPayload(form: ProductForm) {
  return {
    ...form,
    slug: form.slug || slugify(form.title),
    price: Number(form.price),
    salePrice: form.salePrice ? Number(form.salePrice) : null,
    stock: Number(form.stock),
    tags: form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const term = query.toLowerCase();
    return products.filter((product) => {
      return (
        product.title.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        product.categoryName.toLowerCase().includes(term)
      );
    });
  }, [products, query]);

  const loadProducts = (showLoading = true) => {
    if (showLoading) setLoading(true);
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data?.products) setProducts(data.products);
      })
      .catch((error) => {
        console.error('Failed to load products:', error);
        setStatus('Could not load products. Check the products API.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data?.products) setProducts(data.products);
      })
      .catch((error) => {
        console.error('Failed to load products:', error);
        setStatus('Could not load products. Check the products API.');
      })
      .finally(() => setLoading(false));
  }, []);

  const updateForm = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === 'title' && !current.id ? { slug: slugify(String(value)) } : {}),
    }));
  };

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      sku: `MHG-${Math.floor(100 + Math.random() * 900)}-${products.length + 1}`,
    });
    setStatus(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setForm(toForm(product));
    setStatus(null);
    setModalOpen(true);
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(form)),
      });

      if (!res.ok) throw new Error('Save failed');

      setModalOpen(false);
      setStatus(form.id ? 'Painting updated successfully.' : 'Painting added successfully.');
      loadProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      setStatus('Could not save painting. Check required fields and database settings.');
    } finally {
      setSaving(false);
    }
  };

  const archiveProduct = async (product: Product) => {
    if (!confirm(`Archive "${product.title}" from the public showroom?`)) return;

    try {
      const res = await fetch(`/api/products?id=${product.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Archive failed');
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setStatus('Painting archived.');
    } catch (error) {
      console.error('Failed to archive product:', error);
      setStatus('Could not archive painting.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-madhubani-terracotta dark:text-madhubani-mustard">
            Inventory CMS
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mt-1">Painting Inventory</h1>
          <p className="text-sm text-foreground/60 mt-1 max-w-2xl">
            Create, update, price, publish, and archive artworks shown across the homepage, gallery, cart, and checkout.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="clickable btn-heritage inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-xs font-bold"
        >
          <Plus className="h-4 w-4" />
          Add Painting
        </button>
      </div>

      {status && (
        <div className="rounded-lg border border-madhubani-forest/25 bg-madhubani-forest/10 px-4 py-3 text-xs font-semibold text-madhubani-forest">
          {status}
        </div>
      )}

      <div className="glass-panel rounded-xl border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/45" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, SKU, or style..."
            className="w-full rounded-lg border border-border bg-background/50 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {loading ? (
        <div className="glass-panel h-64 rounded-xl border animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <article key={product.id} className="glass-panel glass-panel-hover rounded-xl border p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="madhubani-border relative h-48 sm:h-32 sm:w-32 flex-shrink-0 overflow-hidden rounded-md bg-card">
                  <Image src={product.featuredImage} alt={product.title} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-serif text-lg font-bold text-foreground">{product.title}</h2>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-madhubani-terracotta dark:text-madhubani-mustard mt-1">
                        {product.categoryName} / {product.sku}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="font-serif text-xl font-bold text-foreground">
                        ${(product.salePrice ?? product.price).toFixed(2)}
                      </span>
                      {product.salePrice && (
                        <span className="block text-xs text-foreground/45 line-through">${product.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-foreground/65 mt-3 line-clamp-2">{product.shortDescription}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-madhubani-forest/10 px-2.5 py-1 text-[10px] font-bold text-madhubani-forest">
                      {product.stock} in stock
                    </span>
                    {product.featured && <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold">Featured</span>}
                    {product.bestSeller && <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold">Best Seller</span>}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => openEdit(product)}
                      className="clickable inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-foreground/5"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => archiveProduct(product)}
                      className="clickable inline-flex items-center gap-1.5 rounded-lg border border-madhubani-vermillion/25 px-3 py-2 text-xs font-bold text-madhubani-vermillion hover:bg-madhubani-vermillion/10"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/85 p-4 backdrop-blur-md">
          <div className="min-h-full flex items-center justify-center">
            <form onSubmit={saveProduct} className="glass-panel w-full max-w-4xl rounded-xl border p-5 md:p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="font-serif text-xl font-bold">{form.id ? 'Edit Painting' : 'Add Painting'}</h2>
                  <p className="text-xs text-foreground/60 mt-1">All saved changes reflect on the public website.</p>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} className="clickable rounded-full p-2 hover:bg-foreground/5">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="md:col-span-2 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Title</span>
                    <input value={form.title} onChange={(event) => updateForm('title', event.target.value)} required className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Slug</span>
                    <input value={form.slug} onChange={(event) => updateForm('slug', event.target.value)} className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">SKU</span>
                    <input value={form.sku} onChange={(event) => updateForm('sku', event.target.value)} required className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Style</span>
                    <select value={form.categoryId} onChange={(event) => updateForm('categoryId', event.target.value)} className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent">
                      {Object.entries(CATEGORY_NAMES).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Status</span>
                    <select value={form.status} onChange={(event) => updateForm('status', event.target.value as ProductForm['status'])} className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent">
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Price</span>
                    <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateForm('price', Number(event.target.value))} required className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Sale Price</span>
                    <input type="number" min="0" step="0.01" value={form.salePrice ?? ''} onChange={(event) => updateForm('salePrice', event.target.value ? Number(event.target.value) : null)} className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Stock</span>
                    <input type="number" min="0" value={form.stock} onChange={(event) => updateForm('stock', Number(event.target.value))} required className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
                  </label>
                  <label className="md:col-span-2 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Featured Image Path</span>
                    <input value={form.featuredImage} onChange={(event) => updateForm('featuredImage', event.target.value)} required className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
                  </label>
                  <label className="md:col-span-2 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Short Description</span>
                    <input value={form.shortDescription} onChange={(event) => updateForm('shortDescription', event.target.value)} required className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
                  </label>
                  <label className="md:col-span-2 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Long Description</span>
                    <textarea rows={5} value={form.longDescription} onChange={(event) => updateForm('longDescription', event.target.value)} required className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
                  </label>
                  <label className="md:col-span-2 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Tags</span>
                    <input value={form.tags} onChange={(event) => updateForm('tags', event.target.value)} placeholder="peacock, bharni, handmade" className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
                  </label>
                </div>

                <aside className="space-y-4">
                  <div className="madhubani-border relative aspect-[4/5] overflow-hidden rounded-md bg-card">
                    {form.featuredImage ? (
                      <Image src={form.featuredImage} alt={form.title || 'Painting preview'} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-5 text-center text-xs text-foreground/45">
                        Add an image path to preview the painting.
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border border-border bg-background/35 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/55">
                      <ImageIcon className="h-4 w-4" />
                      Display Flags
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      {[
                        ['featured', 'Featured on homepage'],
                        ['newArrival', 'New arrival'],
                        ['bestSeller', 'Best seller'],
                      ].map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!form[key as keyof ProductForm]}
                            onChange={(event) => updateForm(key as keyof ProductForm, event.target.checked as never)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setModalOpen(false)} className="clickable rounded-lg border border-border px-5 py-3 text-xs font-bold hover:bg-foreground/5">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="clickable btn-heritage inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-xs font-bold disabled:opacity-60">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Painting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

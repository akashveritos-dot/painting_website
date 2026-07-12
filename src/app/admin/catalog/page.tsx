'use client';

import { useEffect, useState } from 'react';
import { Save, Trash2, X, Palette, Layers, Image as ImageIcon } from 'lucide-react';

type FieldType = 'text' | 'textarea' | 'number' | 'checkbox';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
}

interface EntityConfig {
  label: string;
  endpoint: string;
  icon: typeof Palette;
  fields: FieldDef[];
  primary: string; // key shown as the item title
  secondary?: string; // key shown under the title
  slugFrom?: string; // auto-fill `slug` from this key when slug is blank
}

const ENTITIES: Record<string, EntityConfig> = {
  artists: {
    label: 'Artists',
    endpoint: '/api/artists',
    icon: Palette,
    primary: 'name',
    secondary: 'slug',
    slugFrom: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text' },
      { key: 'bio', label: 'Biography', type: 'textarea' },
      { key: 'image', label: 'Image Path', type: 'text' },
      { key: 'active', label: 'Active', type: 'checkbox' },
    ],
  },
  collections: {
    label: 'Collections',
    endpoint: '/api/collections',
    icon: Layers,
    primary: 'name',
    secondary: 'slug',
    slugFrom: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image', label: 'Image Path', type: 'text' },
      { key: 'active', label: 'Active', type: 'checkbox' },
    ],
  },
  banners: {
    label: 'Banners',
    endpoint: '/api/banners',
    icon: ImageIcon,
    primary: 'title',
    secondary: 'linkUrl',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
      { key: 'image', label: 'Image Path', type: 'text', required: true },
      { key: 'linkUrl', label: 'Link URL', type: 'text' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number' },
      { key: 'active', label: 'Active', type: 'checkbox' },
    ],
  },
};

type Item = Record<string, unknown> & { id: string };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function emptyForm(config: EntityConfig): Record<string, unknown> {
  const form: Record<string, unknown> = {};
  config.fields.forEach((f) => {
    form[f.key] = f.type === 'checkbox' ? true : f.type === 'number' ? 0 : '';
  });
  return form;
}

function Manager({ config }: { config: EntityConfig }) {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<Record<string, unknown>>(emptyForm(config));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(config.endpoint)
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setStatus(`Could not load ${config.label}. Run scripts/migrate-catalog.sql if the table is missing.`))
      .finally(() => setLoading(false));
  };

  useEffect(load, [config.endpoint]);

  const startNew = () => {
    setEditingId(null);
    setForm(emptyForm(config));
    setStatus(null);
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    const next: Record<string, unknown> = {};
    config.fields.forEach((f) => {
      next[f.key] = f.type === 'checkbox' ? !!item[f.key] : item[f.key] ?? (f.type === 'number' ? 0 : '');
    });
    setForm(next);
    setStatus(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    if (editingId) payload.id = editingId;
    if (config.slugFrom && !payload.slug) payload.slug = slugify(String(payload[config.slugFrom] || ''));

    const res = await fetch(config.endpoint, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setStatus(editingId ? `${config.label} entry updated.` : `${config.label} entry added.`);
      startNew();
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus(data.error || `Could not save ${config.label} entry.`);
    }
  };

  const remove = async (item: Item) => {
    if (!confirm(`Delete "${item[config.primary]}"?`)) return;
    const res = await fetch(`${config.endpoint}?id=${item.id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems((cur) => cur.filter((i) => i.id !== item.id));
      if (editingId === item.id) startNew();
    } else {
      setStatus(`Could not delete ${config.label} entry.`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
      {/* List */}
      <div className="space-y-3">
        {status && (
          <div className="rounded-lg border border-madhubani-forest/25 bg-madhubani-forest/10 px-4 py-3 text-xs font-semibold text-madhubani-forest">
            {status}
          </div>
        )}
        {loading ? (
          <div className="glass-panel h-40 rounded-xl border animate-pulse" />
        ) : items.length === 0 ? (
          <div className="glass-panel rounded-xl border p-8 text-center text-sm text-foreground/55">
            No {config.label.toLowerCase()} yet. Add your first entry.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="glass-panel rounded-xl border p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-foreground truncate">{String(item[config.primary] || 'Untitled')}</span>
                  {!item.active && <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-bold uppercase text-foreground/50">Hidden</span>}
                </div>
                {config.secondary && (
                  <span className="text-xs text-foreground/55 truncate block">{String(item[config.secondary] || '—')}</span>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => startEdit(item)} className="clickable rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-foreground/5">Edit</button>
                <button onClick={() => remove(item)} className="clickable rounded-lg border border-madhubani-vermillion/25 p-2 text-madhubani-vermillion hover:bg-madhubani-vermillion/10" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form */}
      <form onSubmit={save} className="glass-panel rounded-xl border p-5 space-y-4 lg:sticky lg:top-8">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold">{editingId ? 'Edit' : 'Add'} {config.label.replace(/s$/, '')}</h3>
          {editingId && (
            <button type="button" onClick={startNew} className="clickable rounded-full p-1.5 hover:bg-foreground/5" aria-label="New">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {config.fields.map((field) => (
          <label key={field.key} className="block space-y-1.5">
            {field.type !== 'checkbox' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">{field.label}</span>
            )}
            {field.type === 'textarea' ? (
              <textarea
                rows={3}
                value={String(form[field.key] ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
            ) : field.type === 'checkbox' ? (
              <span className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!form[field.key]}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.checked }))}
                />
                {field.label}
              </span>
            ) : (
              <input
                type={field.type}
                required={field.required}
                value={String(form[field.key] ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
            )}
          </label>
        ))}

        <button type="submit" className="clickable btn-heritage w-full rounded-lg py-3 text-xs font-bold flex items-center justify-center gap-2">
          <Save className="h-4 w-4" /> {editingId ? 'Update' : 'Add'} {config.label.replace(/s$/, '')}
        </button>
      </form>
    </div>
  );
}

export default function AdminCatalogPage() {
  const [tab, setTab] = useState<keyof typeof ENTITIES>('artists');

  return (
    <div className="space-y-6">
      <div>
        <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-madhubani-terracotta dark:text-madhubani-mustard">
          Catalog Entities
        </span>
        <h1 className="font-serif text-2xl md:text-3xl font-bold mt-1">Artists, Collections &amp; Banners</h1>
        <p className="text-sm text-foreground/60 mt-1">Manage curated groupings and homepage banners shown across the storefront.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(ENTITIES) as Array<keyof typeof ENTITIES>).map((key) => {
          const Icon = ENTITIES[key].icon;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`clickable inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                tab === key
                  ? 'bg-madhubani-terracotta dark:bg-madhubani-mustard text-white dark:text-madhubani-soot shadow-md'
                  : 'border border-border hover:bg-foreground/5 text-foreground/75'
              }`}
            >
              <Icon className="h-4 w-4" />
              {ENTITIES[key].label}
            </button>
          );
        })}
      </div>

      <Manager key={tab} config={ENTITIES[tab]} />
    </div>
  );
}

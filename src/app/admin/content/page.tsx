'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { DEFAULT_HOME_CONTENT, HomeContent } from '@/lib/site-content';
import { ImageIcon, Save, Sparkles } from 'lucide-react';

const FIELD_GROUPS: Array<{
  title: string;
  description: string;
  fields: Array<{ key: keyof HomeContent; label: string; type?: 'textarea' | 'text' }>;
}> = [
  {
    title: 'Homepage Hero',
    description: 'Main first-screen message, buttons, and positioning copy.',
    fields: [
      { key: 'heroEyebrow', label: 'Eyebrow' },
      { key: 'heroTitleLine1', label: 'Title Line 1' },
      { key: 'heroTitleAccent', label: 'Highlighted Title' },
      { key: 'heroTitleLine3', label: 'Title Line 3' },
      { key: 'heroDescription', label: 'Hero Description', type: 'textarea' },
      { key: 'heroPrimaryCta', label: 'Primary Button' },
      { key: 'heroSecondaryCta', label: 'Secondary Button' },
    ],
  },
  {
    title: 'Hero Artwork',
    description: 'Controls the feature image card shown on the homepage.',
    fields: [
      { key: 'heroImage', label: 'Image Path or URL' },
      { key: 'heroImageAlt', label: 'Image Alt Text' },
      { key: 'heroImageLabel', label: 'Image Label' },
      { key: 'heroImageTitle', label: 'Image Title' },
      { key: 'heroImageDescription', label: 'Image Description' },
    ],
  },
  {
    title: 'Homepage Sections',
    description: 'Reusable copy shown below the hero and near the catalog.',
    fields: [
      { key: 'exhibitionTitle', label: 'Exhibition Title' },
      { key: 'exhibitionDescription', label: 'Exhibition Description', type: 'textarea' },
      { key: 'trustTitle', label: 'Trust Section Title' },
      { key: 'trustDescription', label: 'Trust Section Description', type: 'textarea' },
    ],
  },
];

export default function AdminContentPage() {
  const [home, setHome] = useState<HomeContent>(DEFAULT_HOME_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/site-content')
      .then((res) => res.json())
      .then((data) => {
        if (data?.home) setHome(data.home);
      })
      .catch((error) => {
        console.error('Failed to load page content:', error);
        setStatus('Using default content because the server content could not be loaded.');
      })
      .finally(() => setLoading(false));
  }, []);

  const updateField = (key: keyof HomeContent, value: string) => {
    setHome((current) => ({ ...current, [key]: value }));
  };

  const saveContent = async () => {
    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch('/api/site-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home }),
      });

      if (!res.ok) throw new Error('Save failed');

      const data = await res.json();
      setHome(data.home);
      setStatus('Homepage content saved. Public pages will use these values now.');
    } catch (error) {
      console.error('Failed to save page content:', error);
      setStatus('Could not save content. Check database settings and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-madhubani-terracotta dark:text-madhubani-mustard">
            Website CMS
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mt-1">Page Content</h1>
          <p className="text-sm text-foreground/60 mt-1 max-w-2xl">
            Edit homepage titles, descriptions, CTA labels, and hero artwork from one organized workspace.
          </p>
        </div>
        <button
          onClick={saveContent}
          disabled={saving || loading}
          className="clickable btn-heritage inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-xs font-bold disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Content'}
        </button>
      </div>

      {status && (
        <div className="rounded-lg border border-madhubani-forest/25 bg-madhubani-forest/10 px-4 py-3 text-xs font-semibold text-madhubani-forest">
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-6">
          {FIELD_GROUPS.map((group) => (
            <section key={group.title} className="glass-panel rounded-xl border p-5 md:p-6">
              <div className="mb-5">
                <h2 className="font-serif text-lg font-bold text-foreground">{group.title}</h2>
                <p className="text-xs text-foreground/60 mt-1">{group.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.fields.map((field) => (
                  <label
                    key={field.key}
                    className={field.type === 'textarea' ? 'md:col-span-2 space-y-1.5' : 'space-y-1.5'}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">
                      {field.label}
                    </span>
                    {field.type === 'textarea' ? (
                      <textarea
                        rows={4}
                        value={home[field.key]}
                        onChange={(event) => updateField(field.key, event.target.value)}
                        className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm normal-case focus:outline-none focus:border-accent"
                      />
                    ) : (
                      <input
                        value={home[field.key]}
                        onChange={(event) => updateField(field.key, event.target.value)}
                        className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm normal-case focus:outline-none focus:border-accent"
                      />
                    )}
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="glass-panel rounded-xl border p-5 xl:sticky xl:top-24">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="font-serif text-lg font-bold">Live Preview</h2>
          </div>
          <div className="madhubani-border relative aspect-[4/5] overflow-hidden rounded-md bg-card">
            <Image src={home.heroImage} alt={home.heroImageAlt} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-madhubani-mustard">
                {home.heroImageLabel}
              </span>
              <h3 className="font-serif text-xl font-bold mt-1">{home.heroImageTitle}</h3>
              <p className="text-xs text-white/80 mt-1">{home.heroImageDescription}</p>
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-border bg-background/35 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/55">
              <ImageIcon className="h-4 w-4" />
              Image Tip
            </div>
            <p className="text-xs text-foreground/65 mt-2 leading-relaxed">
              Use local paths like /assets/images/celestial_peacock.png or a full hosted image URL.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

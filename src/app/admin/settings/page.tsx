'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { DEFAULT_PRICING_CONFIG, type PricingConfig } from '@/lib/pricing';

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/pricing-config')
      .then((res) => res.json())
      .then((data) => data?.config && setConfig(data.config))
      .catch(() => setStatus('Could not load current settings.'))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof PricingConfig>(key: K, value: PricingConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const res = await fetch('/api/pricing-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.config) setConfig(data.config);
      setStatus('Saved. These rules now apply to every new order.');
    } else {
      setStatus('Could not save settings.');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-madhubani-terracotta dark:text-madhubani-mustard">
          Store Settings
        </span>
        <h1 className="font-serif text-2xl md:text-3xl font-bold mt-1">Tax &amp; Shipping</h1>
        <p className="text-sm text-foreground/60 mt-1">
          Configure the tax rate and shipping charge applied to every order. Turn either off to remove that line entirely.
        </p>
      </div>

      {loading ? (
        <div className="glass-panel h-64 rounded-xl border animate-pulse" />
      ) : (
        <form onSubmit={save} className="glass-panel rounded-xl border p-6 max-w-xl space-y-6">
          {status && (
            <div className="rounded-lg border border-madhubani-forest/25 bg-madhubani-forest/10 px-4 py-3 text-xs font-semibold text-madhubani-forest">
              {status}
            </div>
          )}

          {/* Tax */}
          <div className="space-y-3 border-b border-border pb-6">
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={config.taxEnabled} onChange={(e) => set('taxEnabled', e.target.checked)} />
              Charge Tax
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Tax Rate (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={config.taxRate}
                disabled={!config.taxEnabled}
                onChange={(e) => set('taxRate', Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent disabled:opacity-50"
              />
            </label>
          </div>

          {/* Shipping */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={config.shippingEnabled} onChange={(e) => set('shippingEnabled', e.target.checked)} />
              Charge Shipping
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Shipping Fee (₹)</span>
                <input
                  type="number"
                  min="0"
                  value={config.shippingFee}
                  disabled={!config.shippingEnabled}
                  onChange={(e) => set('shippingFee', Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent disabled:opacity-50"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Free Shipping Over (₹)</span>
                <input
                  type="number"
                  min="0"
                  value={config.freeShippingThreshold}
                  disabled={!config.shippingEnabled}
                  onChange={(e) => set('freeShippingThreshold', Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent disabled:opacity-50"
                />
              </label>
            </div>
          </div>

          <button type="submit" disabled={saving} className="clickable btn-heritage inline-flex items-center gap-2 rounded-lg px-6 py-3 text-xs font-bold disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      )}
    </div>
  );
}

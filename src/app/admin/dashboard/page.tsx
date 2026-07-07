'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Truck, 
  ShieldCheck,
  Sparkles,
  Tag,
  Plus,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface Stats {
  grossRevenue: number;
  activePatrons: number;
  totalArtworks: number;
  fulfillmentRate: number;
}

interface ChartItem {
  month: string;
  sales: number;
  items: number;
}

interface ActivityLog {
  action: string;
  details: string;
  createdAt: string;
}

interface Product {
  id: string;
  title: string;
  sku: string;
}

interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  expiryDate: string;
  active: boolean | number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Homepage Featured settings
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [savingSetting, setSavingSetting] = useState(false);
  const [settingFeedback, setSettingFeedback] = useState<string | null>(null);

  // Coupon management settings
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [newVal, setNewVal] = useState('');
  const [newMin, setNewMin] = useState('');
  const [newExpiry, setNewExpiry] = useState('2030-12-31');
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);

  const loadCoupons = async () => {
    try {
      const res = await fetch('/api/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const statsRes = await fetch('/api/admin/stats');
        const statsData = await statsRes.json();
        
        setStats(statsData.stats);
        setChartData(statsData.chartData);
        setLogs(statsData.activityLogs);

        // Fetch products list for dropdown
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (prodData.products) {
          setProducts(prodData.products);
        }

        // Fetch current setting value
        const settingsRes = await fetch('/api/settings?key=homepage_exclusive_product_id');
        const settingsData = await settingsRes.json();
        if (settingsData.value) {
          setSelectedProductId(settingsData.value);
        } else if (prodData.products && prodData.products.length > 0) {
          setSelectedProductId(prodData.products[0].id);
        }

        // Load coupons
        await loadCoupons();
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleUpdateExclusiveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    setSavingSetting(true);
    setSettingFeedback(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'homepage_exclusive_product_id',
          value: selectedProductId,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update showcase setting');
      }

      setSettingFeedback('Showcase painting updated successfully! Refresh home page to view.');
      setTimeout(() => setSettingFeedback(null), 3000);
    } catch (err: any) {
      setSettingFeedback(err.message || 'Error updating settings');
    } finally {
      setSavingSetting(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newVal) return;

    setSavingCoupon(true);
    setCouponFeedback(null);

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          discountType: newType,
          discountValue: Number(newVal),
          minOrderAmount: Number(newMin || 0),
          expiryDate: `${newExpiry} 23:59:59`,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create coupon.');
      }

      setCouponFeedback('Coupon registered successfully!');
      setNewCode('');
      setNewVal('');
      setNewMin('');
      await loadCoupons();
      setTimeout(() => setCouponFeedback(null), 3000);
    } catch (err: any) {
      setCouponFeedback(err.message || 'Error creating coupon.');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (id: string, currentActive: boolean | number) => {
    try {
      const res = await fetch('/api/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive }),
      });

      if (res.ok) {
        await loadCoupons();
      }
    } catch (err) {
      console.error('Failed to toggle coupon status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-madhubani-terracotta border-t-transparent" />
      </div>
    );
  }

  const statItems = [
    { 
      name: 'Gross Revenue', 
      value: stats ? `₹${stats.grossRevenue.toLocaleString('en-IN')}` : '₹0', 
      change: 'Real-time Sales', 
      icon: DollarSign 
    },
    { 
      name: 'Active Patrons', 
      value: stats ? `${stats.activePatrons} Accounts` : '0 Accounts', 
      change: 'Registered Patrons', 
      icon: Users 
    },
    { 
      name: 'Artworks Registered', 
      value: stats ? `${stats.totalArtworks} Paintings` : '0 Paintings', 
      change: 'Active Collections', 
      icon: ShoppingBag 
    },
    { 
      name: 'Fulfillment Rate', 
      value: stats ? `${stats.fulfillmentRate}%` : '100%', 
      change: 'Shipped & Delivered', 
      icon: Truck 
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Overview Dashboard</h1>
        <p className="text-sm text-foreground/60 mt-1">
          Monitor exhibition transactions, visitor metrics, and inventory health.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-panel p-5 rounded-xl border relative overflow-hidden bg-card/25 shadow-sm">
              <div className="absolute inset-1.5 border border-foreground/5 rounded-lg pointer-events-none" />
              <div className="flex justify-between items-start relative z-10">
                <span className="font-sans text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                  {stat.name}
                </span>
                <Icon className="h-5 w-5 text-madhubani-terracotta dark:text-madhubani-mustard" />
              </div>
              <div className="mt-4 relative z-10">
                <span className="font-serif text-xl md:text-2xl font-bold text-foreground block">
                  {stat.value}
                </span>
                <span className="font-sans text-[10px] font-semibold text-madhubani-forest mt-1 block">
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Homepage Feature Config Settings */}
        <div className="glass-panel p-6 rounded-xl border relative shadow-sm">
          <div className="absolute inset-2 border border-foreground/5 rounded-lg pointer-events-none" />
          <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2 relative z-10">
            <Sparkles className="h-5 w-5 text-accent" /> Homepage Spotlight Painting
          </h3>

          <form onSubmit={handleUpdateExclusiveProduct} className="space-y-4 relative z-10 text-xs font-semibold uppercase tracking-wide font-sans">
            <div className="space-y-2">
              <label htmlFor="feature-product" className="text-foreground/70">Select Featured Painting</label>
              <select
                id="feature-product"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full border border-border bg-background/50 px-3.5 py-3 text-sm normal-case font-sans rounded-lg focus:outline-none focus:border-accent"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            {settingFeedback && (
              <div className="p-3 text-[10px] font-bold text-madhubani-forest bg-madhubani-forest/10 border border-madhubani-forest/20 rounded-lg">
                {settingFeedback}
              </div>
            )}

            <button
              type="submit"
              disabled={savingSetting || products.length === 0}
              className="clickable btn-heritage px-5 py-3 rounded-lg text-[10px] font-serif font-bold uppercase tracking-wider disabled:opacity-50 animate-fade-in"
            >
              {savingSetting ? 'Updating Showcase...' : 'Update Showcase Banner'}
            </button>
          </form>
        </div>

        {/* Dynamic Coupons Campaigns Manager */}
        <div className="glass-panel p-6 rounded-xl border relative shadow-sm">
          <div className="absolute inset-2 border border-foreground/5 rounded-lg pointer-events-none" />
          <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2 relative z-10">
            <Tag className="h-5 w-5 text-accent" /> Manage Promotion Coupons
          </h3>

          <div className="grid grid-cols-1 gap-6 relative z-10 text-xs font-semibold uppercase tracking-wide font-sans">
            
            {/* Create Coupon Form */}
            <form onSubmit={handleCreateCoupon} className="space-y-3.5 border-b border-border pb-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="coupon-code" className="text-foreground/70">Code</label>
                  <input
                    id="coupon-code"
                    type="text"
                    placeholder="WINTER30"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full border border-border bg-background/50 px-3 py-2 text-xs normal-case rounded-lg focus:outline-none focus:border-accent"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="coupon-type" className="text-foreground/70">Type</label>
                  <select
                    id="coupon-type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full border border-border bg-background/50 px-3 py-2 text-xs normal-case rounded-lg focus:outline-none focus:border-accent font-sans"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="coupon-val" className="text-foreground/70">Value</label>
                  <input
                    id="coupon-val"
                    type="number"
                    min="1"
                    placeholder="15"
                    value={newVal}
                    onChange={(e) => setNewVal(e.target.value)}
                    className="w-full border border-border bg-background/50 px-3 py-2 text-xs rounded-lg focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="coupon-min" className="text-foreground/70">Min Purchase</label>
                  <input
                    id="coupon-min"
                    type="number"
                    min="0"
                    placeholder="5000"
                    value={newMin}
                    onChange={(e) => setNewMin(e.target.value)}
                    className="w-full border border-border bg-background/50 px-3 py-2 text-xs rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label htmlFor="coupon-expiry" className="text-foreground/70 font-sans">Expiry Date</label>
                  <input
                    id="coupon-expiry"
                    type="date"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className="w-full border border-border bg-background/50 px-3 py-2 text-xs rounded-lg focus:outline-none"
                    required
                  />
                </div>
              </div>

              {couponFeedback && (
                <div className="p-2.5 text-[9px] font-bold text-madhubani-forest bg-madhubani-forest/10 border border-madhubani-forest/20 rounded-lg">
                  {couponFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={savingCoupon}
                className="clickable btn-heritage inline-flex items-center gap-1 px-4 py-2.5 rounded-lg text-[9px] font-serif font-bold uppercase tracking-wider disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                {savingCoupon ? 'Registering...' : 'Add Campaign Code'}
              </button>
            </form>

            {/* Coupons List */}
            <div className="max-h-48 overflow-y-auto space-y-2">
              <span className="text-[10px] text-foreground/50 block mb-1">Active Coupon Codes</span>
              {coupons.length === 0 ? (
                <div className="text-center py-4 text-foreground/45 normal-case font-sans">No campaigns found.</div>
              ) : (
                coupons.map((c) => (
                  <div key={c.id} className="flex justify-between items-center py-2 border-b border-border last:border-0 font-sans normal-case text-xs">
                    <div>
                      <span className="font-bold text-foreground tracking-wide uppercase">{c.code}</span>
                      <span className="block text-[10px] text-foreground/60 mt-0.5">
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% Off` : `₹${c.discountValue.toLocaleString('en-IN')} Off`} 
                        {c.minOrderAmount > 0 && ` (Min: ₹${c.minOrderAmount.toLocaleString('en-IN')})`}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleToggleCoupon(c.id, c.active)}
                      className="clickable text-foreground/65 hover:text-foreground p-1 transition-colors"
                    >
                      {c.active ? (
                        <ToggleRight className="h-5 w-5 text-madhubani-forest" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-foreground/30" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="glass-panel p-6 rounded-xl border relative shadow-sm">
        <div className="absolute inset-2 border border-foreground/5 rounded-lg pointer-events-none" />
        <h3 className="font-serif text-lg font-bold text-foreground mb-6 flex items-center gap-2 relative z-10">
          <TrendingUp className="h-5 w-5 text-accent" /> Sales Performance Trend (INR)
        </h3>

        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center font-sans text-xs text-foreground/50">
            No sales data available.
          </div>
        ) : (
          <div className="h-72 w-full relative z-10 font-sans text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="var(--foreground)" opacity={0.5} />
                <YAxis stroke="var(--foreground)" opacity={0.5} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }} 
                />
                <Bar dataKey="sales" fill="var(--color-madhubani-terracotta)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* System Logs */}
      <div className="glass-panel p-6 rounded-xl border relative shadow-sm">
        <div className="absolute inset-2 border border-foreground/5 rounded-lg pointer-events-none" />
        <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2 relative z-10">
          <ShieldCheck className="h-5 w-5 text-accent" /> System Logs (Audits)
        </h3>

        <div className="space-y-3 font-sans text-xs relative z-10">
          {logs.length === 0 ? (
            <div className="text-center py-6 text-foreground/50">No logs found.</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                <div>
                  <span className="font-semibold text-foreground block">{log.action}</span>
                  <span className="text-foreground/60 mt-0.5 block">{log.details}</span>
                </div>
                <span className="text-foreground/45 italic">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

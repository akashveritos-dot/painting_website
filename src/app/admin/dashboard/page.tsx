'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Truck, 
  ShieldCheck 
} from 'lucide-react';

const SALES_DATA = [
  { month: 'Jan', sales: 4000, items: 12 },
  { month: 'Feb', sales: 4500, items: 15 },
  { month: 'Mar', sales: 5200, items: 18 },
  { month: 'Apr', sales: 4800, items: 14 },
  { month: 'May', sales: 6100, items: 22 },
  { month: 'Jun', sales: 7400, items: 25 },
  { month: 'Jul', sales: 8900, items: 31 },
];

export default function AdminDashboardPage() {
  const stats = [
    { name: 'Gross Revenue', value: '$36,900.00', change: '+18.4% MoM', icon: DollarSign },
    { name: 'Active Patrons', value: '184 Accounts', change: '+5.2% MoM', icon: Users },
    { name: 'Artworks Registered', value: '42 Paintings', change: '+4 items', icon: ShoppingBag },
    { name: 'Fulfillment Rate', value: '99.1%', status: 'Nominal', icon: Truck },
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
        {stats.map((stat, idx) => {
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
                <span className="font-serif text-2xl font-bold text-foreground block">
                  {stat.value}
                </span>
                <span className="font-sans text-[10px] font-semibold text-madhubani-forest mt-1 block">
                  {stat.change || stat.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales Trend Chart */}
      <div className="glass-panel p-6 rounded-xl border relative shadow-sm">
        <div className="absolute inset-2 border border-foreground/5 rounded-lg pointer-events-none" />
        <h3 className="font-serif text-lg font-bold text-foreground mb-6 flex items-center gap-2 relative z-10">
          <TrendingUp className="h-5 w-5 text-accent" /> Sales Performance Trend (USD)
        </h3>

        <div className="h-72 w-full relative z-10 font-sans text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={SALES_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
      </div>

      {/* Log activity review */}
      <div className="glass-panel p-6 rounded-xl border relative shadow-sm">
        <div className="absolute inset-2 border border-foreground/5 rounded-lg pointer-events-none" />
        <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2 relative z-10">
          <ShieldCheck className="h-5 w-5 text-accent" /> System Logs (Audits)
        </h3>

        <div className="space-y-3 font-sans text-xs relative z-10">
          {[
            { action: 'Acquisition Confirmed', desc: 'Order MHG-ORD-284915 processed for $390.00', time: '12 mins ago' },
            { action: 'Inventory Modified', desc: 'Stock level for SKU: MHG-PEA-001 updated to 4 pieces', time: '1 hr ago' },
            { action: 'New User Registered', desc: 'User account registered: patron@mithila.com', time: '4 hrs ago' },
          ].map((log, idx) => (
            <div key={idx} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
              <div>
                <span className="font-semibold text-foreground block">{log.action}</span>
                <span className="text-foreground/60 mt-0.5 block">{log.desc}</span>
              </div>
              <span className="text-foreground/45 italic">{log.time}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

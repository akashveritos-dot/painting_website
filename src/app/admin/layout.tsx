'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { LayoutDashboard, ShoppingBag, FolderKanban, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAppStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-madhubani-terracotta border-t-transparent" />
      </div>
    );
  }

  // Security Gate: Ensure only Admins can access
  // For easy demonstration, we can let the user click a mock "Bypass" or check the role.
  // We will check user?.role === 'ADMIN'. If not, we show a gorgeous warning box.
  const isAuthorized = user?.role === 'ADMIN';

  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-md w-full px-6 py-20 text-center flex flex-col items-center justify-center min-h-[65vh]">
        <div className="p-5 rounded-full bg-madhubani-vermillion/10 border border-madhubani-vermillion/20 mb-6">
          <ShieldAlert className="h-12 w-12 text-madhubani-vermillion" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-foreground/60 mt-3 leading-relaxed">
          The administration dashboard is restricted to curator accounts only. Please sign in with an authorized administrator account.
        </p>
        
        {/* Mock Bypass option for demonstration */}
        <div className="mt-8 p-4 border border-dashed border-border rounded-xl bg-card w-full text-xs font-sans text-left space-y-2">
          <span className="font-bold text-foreground block">Curator Quick-Gate:</span>
          <p className="text-foreground/75 leading-relaxed">
            To view the full functionality of the Admin Dashboard, please sign in with an Admin account or update your role in the database.
          </p>
        </div>

        <Link
          href="/auth/login"
          className="clickable mt-8 inline-flex items-center gap-2 rounded-lg bg-madhubani-terracotta dark:bg-madhubani-mustard px-6 py-3 font-serif text-sm font-semibold text-white dark:text-madhubani-soot hover:opacity-90 shadow-md"
        >
          Sign In as Admin
        </Link>
      </div>
    );
  }

  const navItems = [
    { href: '/admin/dashboard', name: 'Overview Analytics', icon: LayoutDashboard },
    { href: '/admin/products', name: 'Manage Paintings', icon: ShoppingBag },
  ];

  return (
    <div className="mx-auto max-w-7xl w-full px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      
      {/* Sidebar Navigation */}
      <aside className="md:col-span-3 space-y-4">
        <div className="glass-panel p-5 rounded-xl border">
          <span className="font-sans text-[10px] font-bold text-foreground/50 uppercase tracking-widest block mb-4">
            Curator Actions
          </span>
          <nav className="space-y-1 text-xs font-semibold uppercase tracking-wide font-sans">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-madhubani-terracotta dark:bg-madhubani-mustard text-white dark:text-madhubani-soot font-bold'
                      : 'hover:bg-foreground/5 text-foreground/75'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <Link
          href="/"
          className="clickable flex items-center justify-center gap-1.5 px-4 py-3 border border-border bg-card/25 rounded-lg text-xs font-bold font-sans uppercase tracking-wider text-foreground/70 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Exit Console
        </Link>
      </aside>

      {/* Main Content Workspace */}
      <main className="md:col-span-9">
        {children}
      </main>

    </div>
  );
}

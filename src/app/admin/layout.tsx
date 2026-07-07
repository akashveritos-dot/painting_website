'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ArrowLeft,
  Truck,
  MessageSquare,
  Sliders 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const setUser = useAppStore((state) => state.setUser);
  
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Perform server-side session query directly to avoid state race conditions
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && data.user && data.user.role === 'ADMIN') {
          setAuthorized(true);
          setUser(data.user); // Sync store
        } else {
          setAuthorized(false);
        }
      })
      .catch((err) => {
        console.error('Admin layout auth query failed:', err);
        setAuthorized(false);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, [setUser]);

  // Handle redirection for unauthorized sessions
  useEffect(() => {
    if (!checkingAuth && !authorized) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [checkingAuth, authorized, pathname, router]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-madhubani-terracotta border-t-transparent" />
        <span className="font-sans text-xs text-foreground/50 uppercase tracking-widest font-semibold">
          Authorizing Curator...
        </span>
      </div>
    );
  }

  if (!authorized) {
    // Briefly show blank while redirecting
    return null;
  }

  const navItems = [
    { href: '/admin/dashboard', name: 'Overview Analytics', icon: LayoutDashboard },
    { href: '/admin/products', name: 'Manage Paintings', icon: ShoppingBag },
    { href: '/admin/orders', name: 'Review Orders', icon: Truck },
    { href: '/admin/contacts', name: 'Contact Inbox', icon: MessageSquare },
    { href: '/admin/content', name: 'Page Content', icon: Sliders },
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

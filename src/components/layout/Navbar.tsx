'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/lib/store';
import { 
  ShoppingBag, 
  Heart, 
  User, 
  Sun, 
  Moon, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard 
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const { user, cart, wishlist, setUser, clearCart, clearWishlist } = useAppStore();

  // Load user session on mount
  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setMounted(true));
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch((err) => {
        console.error('Error checking auth state:', err);
        setUser(null);
      });

    return () => window.cancelAnimationFrame(frameId);
  }, [setUser]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        clearCart();
        clearWishlist();
        router.push('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Prevent hydration mismatches
  const cartCount = mounted ? cart.reduce((acc, item) => acc + item.quantity, 0) : 0;
  const wishlistCount = mounted ? wishlist.length : 0;

  // Admin has its own chrome — hide the storefront nav. Placed after all hooks so
  // the hook order stays stable across route changes (Rules of Hooks).
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="glass-panel sticky top-0 z-40 w-full border-b transition-all duration-300">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Heritage Logo */}
        <Link href="/" className="group flex items-center" aria-label="Mithila Heritage Gallery home">
          <span className="relative block h-28 w-28 translate-y-3 sm:h-32 sm:w-32">
            <Image
              src="/icon madhubni-Photoroom.png"
              alt="Mithila Heritage Gallery logo"
              fill
              sizes="(min-width: 640px) 128px, 112px"
              className="object-contain"
              priority
            />
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 font-sans text-sm font-medium tracking-wide">
          <Link href="/" className="hover:text-madhubani-terracotta dark:hover:text-madhubani-mustard transition-colors">
            Home
          </Link>
          <Link href="/gallery" className="hover:text-madhubani-terracotta dark:hover:text-madhubani-mustard transition-colors">
            Art Gallery
          </Link>
          <Link href="/blogs" className="hover:text-madhubani-terracotta dark:hover:text-madhubani-mustard transition-colors">
            Mithila Chronicles
          </Link>
          <Link href="/contact" className="hover:text-madhubani-terracotta dark:hover:text-madhubani-mustard transition-colors">
            Contact
          </Link>
        </nav>

        {/* Action Widgets */}
        <div className="flex items-center gap-4">
          {/* Theme Switcher */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="clickable p-2 hover:bg-foreground/5 rounded-full text-foreground/80 hover:text-foreground transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="clickable relative p-2 hover:bg-foreground/5 rounded-full text-foreground/80 hover:text-foreground transition-all duration-200"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-madhubani-vermillion text-[9px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="clickable relative p-2 hover:bg-foreground/5 rounded-full text-foreground/80 hover:text-foreground transition-all duration-200"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-madhubani-terracotta text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Account Controls */}
          {mounted && (
            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="clickable flex items-center gap-1.5 p-2 hover:bg-foreground/5 rounded-full text-foreground/80 hover:text-foreground transition-all duration-200"
                    aria-label="User Account Menu"
                  >
                    <User className="h-5 w-5" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-xl border border-border bg-card p-2 shadow-2xl backdrop-blur-xl animate-scale-in">
                      <div className="border-b border-border px-4 py-2 text-xs">
                        <p className="font-semibold text-foreground">{user.name || 'Art Patron'}</p>
                        <p className="text-foreground/60 truncate">{user.email}</p>
                      </div>

                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-foreground/5 rounded-lg text-madhubani-terracotta dark:text-madhubani-mustard font-medium transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Admin Console
                        </Link>
                      )}

                      <Link
                        href="/orders"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-foreground/5 rounded-lg text-foreground transition-colors"
                      >
                        Order History
                      </Link>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-madhubani-vermillion/10 hover:text-madhubani-vermillion rounded-lg text-foreground transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden md:inline-flex items-center justify-center rounded-full bg-madhubani-terracotta dark:bg-madhubani-mustard px-5 py-2 font-serif text-sm text-white dark:text-madhubani-soot hover:opacity-90 transition-all font-medium"
                >
                  Enter Gallery
                </Link>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden hover:bg-foreground/5 rounded-full text-foreground/80 hover:text-foreground transition-all duration-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card p-6 backdrop-blur-xl animate-fade-in-up">
          <nav className="flex flex-col gap-5 text-base font-semibold tracking-wide">
            <Link 
              href="/" 
              onClick={() => setMobileMenuOpen(false)} 
              className="hover:text-madhubani-terracotta dark:hover:text-madhubani-mustard transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/gallery" 
              onClick={() => setMobileMenuOpen(false)} 
              className="hover:text-madhubani-terracotta dark:hover:text-madhubani-mustard transition-colors"
            >
              Art Gallery
            </Link>
            <Link 
              href="/blogs" 
              onClick={() => setMobileMenuOpen(false)} 
              className="hover:text-madhubani-terracotta dark:hover:text-madhubani-mustard transition-colors"
            >
              Mithila Chronicles
            </Link>
            <Link 
              href="/contact" 
              onClick={() => setMobileMenuOpen(false)} 
              className="hover:text-madhubani-terracotta dark:hover:text-madhubani-mustard transition-colors"
            >
              Contact
            </Link>
            {mounted && user && (
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-madhubani-terracotta dark:hover:text-madhubani-mustard transition-colors"
              >
                My Orders
              </Link>
            )}
            {mounted && !user && (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-full bg-madhubani-terracotta px-5 py-2.5 font-serif text-sm text-white"
              >
                Enter Gallery
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAppStore((state) => state.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      setUser(data.user);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-12 md:py-24">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-madhubani-mustard/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-madhubani-terracotta/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel w-full max-w-md p-8 md:p-10 rounded-2xl shadow-2xl relative"
      >
        {/* Madhubani double border indicator */}
        <div className="absolute inset-2 border border-foreground/5 rounded-xl pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative z-10">
          <h2 className="font-serif text-3xl font-bold tracking-wide text-madhubani-terracotta dark:text-madhubani-mustard">
            Enter Gallery
          </h2>
          <p className="text-sm text-foreground/60 mt-2 text-center">
            Sign in to access secure shopping, curate your collection, and view history.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 text-sm rounded-lg bg-madhubani-vermillion/10 border border-madhubani-vermillion/20 text-madhubani-vermillion text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {/* Email field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/45" />
              <input
                id="email"
                type="email"
                placeholder="patron@mithila.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-accent text-sm"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70" htmlFor="password">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-xs text-madhubani-terracotta hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/45" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-accent text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/45 hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me / Cookies note */}
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-border text-madhubani-terracotta focus:ring-madhubani-terracotta"
            />
            <label htmlFor="remember" className="ml-2 text-xs text-foreground/60 select-none">
              Keep me signed in for 7 days
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="clickable w-full py-3.5 bg-madhubani-terracotta dark:bg-madhubani-mustard text-white dark:text-madhubani-soot font-serif tracking-widest text-sm rounded-lg hover:opacity-90 transition-opacity font-semibold shadow-lg flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white dark:border-madhubani-soot border-t-transparent" />
            ) : (
              'VERIFY IDENTITY'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-foreground/60 mt-8 relative z-10">
          New to the Heritage Store?{' '}
          <Link href="/auth/signup" className="text-madhubani-terracotta dark:text-madhubani-mustard font-semibold hover:underline">
            Register Account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

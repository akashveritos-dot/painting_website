'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
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
            Register Patron
          </h2>
          <p className="text-sm text-foreground/60 mt-2 text-center">
            Create an account to track orders, save favorites, and write reviews.
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

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 text-sm rounded-lg bg-madhubani-forest/10 border border-madhubani-forest/20 text-madhubani-forest text-center"
          >
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* Full Name */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70" htmlFor="name">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/45" />
              <input
                id="name"
                type="text"
                placeholder="Arya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-accent text-sm"
                required
              />
            </div>
          </div>

          {/* Email field */}
          <div className="space-y-2.5">
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
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/45" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
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

          {/* Confirm Password field */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/45" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-accent text-sm"
                required
              />
            </div>
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
              'CREATE ACCOUNT'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-foreground/60 mt-8 relative z-10">
          Already registered?{' '}
          <Link href="/auth/login" className="text-madhubani-terracotta dark:text-madhubani-mustard font-semibold hover:underline">
            Log In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

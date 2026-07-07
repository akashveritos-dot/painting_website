'use client';

import { useState } from 'react';
import { Mail, MapPin, Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) throw new Error('Submit failed');

      setName('');
      setEmail('');
      setMessage('');
      setStatus('Your message was saved. Our curator team will reply soon.');
    } catch (error) {
      console.error('Contact submit failed:', error);
      setStatus('Could not send your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl w-full px-6 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-5"
        >
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-madhubani-terracotta dark:text-madhubani-mustard">
            <Sparkles className="h-4 w-4" />
            Curator Desk
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-bold mt-3 text-foreground">Contact Mithila Heritage Gallery</h1>
          <p className="text-sm text-foreground/65 mt-4 leading-relaxed max-w-lg">
            Ask about artwork provenance, custom framing, shipping, artisan certificates, or bulk curation for your space.
          </p>
          <div className="mt-8 space-y-4">
            <div className="glass-panel rounded-xl border p-4 flex gap-3">
              <Mail className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <span className="font-serif font-bold">Email Support</span>
                <p className="text-xs text-foreground/60 mt-1">Saved securely in the admin contact review panel.</p>
              </div>
            </div>
            <div className="glass-panel rounded-xl border p-4 flex gap-3">
              <MapPin className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <span className="font-serif font-bold">Mithila Workshop Network</span>
                <p className="text-xs text-foreground/60 mt-1">Curated from artisan communities and verified guild partners.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel lg:col-span-7 rounded-xl border p-5 md:p-8 shadow-sm"
        >
          <h2 className="font-serif text-2xl font-bold">Send a Message</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} required className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-3 text-sm focus:outline-none focus:border-accent" />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-3 text-sm focus:outline-none focus:border-accent" />
            </label>
            <label className="md:col-span-2 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Message</span>
              <textarea rows={7} value={message} onChange={(event) => setMessage(event.target.value)} required className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-3 text-sm focus:outline-none focus:border-accent" />
            </label>
          </div>
          {status && <p className="mt-4 text-xs font-semibold text-madhubani-forest">{status}</p>}
          <button disabled={submitting} className="clickable btn-heritage mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-xs font-bold disabled:opacity-60">
            <Send className="h-4 w-4" />
            {submitting ? 'Sending...' : 'Submit Request'}
          </button>
        </motion.form>
      </div>
    </div>
  );
}

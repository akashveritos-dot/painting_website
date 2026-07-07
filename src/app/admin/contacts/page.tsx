'use client';

import { useEffect, useState } from 'react';
import { CheckCheck, MailOpen, Reply } from 'lucide-react';

interface ContactRequest {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'REPLIED';
  createdAt: string;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true,
  }).format(new Date(value.replace(' ', 'T')));
}

export default function AdminContactsPage() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/contact')
      .then((res) => res.json())
      .then((data) => {
        if (data?.requests) setRequests(data.requests);
      })
      .catch((error) => {
        console.error('Failed to load contact requests:', error);
        setStatus('Could not load contact requests.');
      })
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, nextStatus: ContactRequest['status']) => {
    const res = await fetch('/api/contact', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: nextStatus }),
    });

    if (res.ok) {
      setRequests((current) => current.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
      setStatus(`Contact request marked ${nextStatus}.`);
    } else {
      setStatus('Could not update contact request.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-madhubani-terracotta dark:text-madhubani-mustard">
          Support
        </span>
        <h1 className="font-serif text-2xl md:text-3xl font-bold mt-1">Contact Inbox</h1>
        <p className="text-sm text-foreground/60 mt-1">Review messages submitted from the public contact form.</p>
      </div>

      {status && <div className="rounded-lg border border-madhubani-forest/25 bg-madhubani-forest/10 px-4 py-3 text-xs font-semibold text-madhubani-forest">{status}</div>}

      {loading ? (
        <div className="glass-panel h-64 rounded-xl border animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {requests.map((request) => (
            <article key={request.id} className="glass-panel rounded-xl border p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl font-bold">{request.name}</h2>
                  <p className="text-xs text-foreground/60 mt-1">{request.email}</p>
                  <p className="text-[10px] uppercase tracking-wider text-foreground/45 mt-2">{formatDate(request.createdAt)}</p>
                </div>
                <span className="rounded-full bg-madhubani-mustard/15 px-2.5 py-1 text-[10px] font-bold">
                  {request.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground/75">{request.message}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => updateStatus(request.id, 'READ')} className="clickable inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-foreground/5">
                  <MailOpen className="h-4 w-4" />
                  Read
                </button>
                <button onClick={() => updateStatus(request.id, 'REPLIED')} className="clickable inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-foreground/5">
                  <Reply className="h-4 w-4" />
                  Replied
                </button>
                <button onClick={() => updateStatus(request.id, 'UNREAD')} className="clickable inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-foreground/5">
                  <CheckCheck className="h-4 w-4" />
                  Unread
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

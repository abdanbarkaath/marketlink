'use client';

import React, { useState } from 'react';
import { useMarketLinkTheme } from '../../../components/ThemeToggle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export default function InquiryForm({ providerSlug }: { providerSlug: string }) {
  const { t } = useMarketLinkTheme();
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return; // hard guard (prevents double submit)

    setError(null);
    setSent(false);
    setSaving(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '')
      .trim()
      .toLowerCase();
    const phoneRaw = String(fd.get('phone') || '').trim();
    const phone = phoneRaw ? phoneRaw : undefined;
    const message = String(fd.get('message') || '').trim();

    if (!name || !email || !message) {
      setSaving(false);
      setError('Please fill in name, email, and message.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // safe even if not needed
        cache: 'no-store',
        body: JSON.stringify({ providerSlug, name, email, phone, message }),
      });

      if (!res.ok) {
        let msg = `Failed to send message (${res.status})`;
        try {
          const body = await res.json();
          if (body?.error) msg = String(body.error);
          else if (body?.message) msg = String(body.message);
        } catch {
          // ignore parse errors
        }
        setSent(false);
        setError(msg);
        return;
      }

      setError(null);
      setSent(true);
      form.reset();
    } catch {
      setSent(false);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`rounded-2xl ${t.surface} ${t.border} border p-6 shadow-[0_14px_45px_rgba(2,6,23,0.08)] backdrop-blur`}>
      {sent && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800 mb-4">Message sent!</div>}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="name" className={`text-sm font-medium ${t.mutedText}`}>
            Name *
          </label>
          <input
            id="name"
            name="name"
            required
            disabled={saving}
            className={`w-full rounded-xl ${t.border} border ${t.surfaceMuted} px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-200`}
            placeholder="Jane"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="email" className={`text-sm font-medium ${t.mutedText}`}>
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              disabled={saving}
              className={`w-full rounded-xl ${t.border} border ${t.surfaceMuted} px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-200`}
              placeholder="you@cafe.com"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="phone" className={`text-sm font-medium ${t.mutedText}`}>
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              disabled={saving}
              className={`w-full rounded-xl ${t.border} border ${t.surfaceMuted} px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-200`}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label htmlFor="message" className={`text-sm font-medium ${t.mutedText}`}>
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={4}
            disabled={saving}
            className={`w-full rounded-xl ${t.border} border ${t.surfaceMuted} px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-200 resize-none`}
            placeholder="What do you need help with?"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className={`text-sm ${t.mutedText}`}>* required</p>
          <button
            type="submit"
            disabled={saving}
            className={`rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition ${t.primaryBtn} ${saving ? 'opacity-60' : 'hover:opacity-95'}`}
          >
            {saving ? 'Sending…' : 'Send Message'}
          </button>
        </div>
      </form>
    </div>
  );
}

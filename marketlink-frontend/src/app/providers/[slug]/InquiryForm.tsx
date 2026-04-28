'use client';

import React, { useState } from 'react';
import { useMarketLinkTheme } from '../../../components/ThemeToggle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export default function InquiryForm({ expertSlug }: { expertSlug: string }) {
  const { t } = useMarketLinkTheme();
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldClass = 'ml-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

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
      setError('Please fill in your name, email, and inquiry details.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ expertSlug, name, email, phone, message }),
      });

      if (!res.ok) {
        let msg = `Failed to send inquiry (${res.status})`;
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
    <div className="ml-card rounded-[1.35rem] p-5 shadow-[0_14px_40px_rgba(23,26,31,0.08)]">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#d4c6b4]/70 pb-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Inquiry details</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">Share what you need help with, your timeline, and any budget guidance. The expert will receive it directly.</p>
        </div>
        <span className="ml-pill rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]">
          Fast response
        </span>
      </div>

      {sent ? <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Inquiry sent!</div> : null}

      {error ? (
        <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="name" className={`text-sm font-medium ${t.mutedText}`}>
            Name *
          </label>
          <input id="name" name="name" required disabled={saving} className={fieldClass} placeholder="Jane" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="email" className={`text-sm font-medium ${t.mutedText}`}>
              Email *
            </label>
            <input id="email" name="email" type="email" required disabled={saving} className={fieldClass} placeholder="you@cafe.com" />
          </div>

          <div className="grid gap-2">
            <label htmlFor="phone" className={`text-sm font-medium ${t.mutedText}`}>
              Phone
            </label>
            <input id="phone" name="phone" disabled={saving} className={fieldClass} placeholder="Optional" />
          </div>
        </div>

        <div className="grid gap-2">
          <label htmlFor="message" className={`text-sm font-medium ${t.mutedText}`}>
            Project details *
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={4}
            disabled={saving}
            className={`${fieldClass} min-h-[132px] resize-none`}
            placeholder="What do you need help with, and when do you need it?"
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-[#d4c6b4]/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className={`text-sm ${t.mutedText}`}>* required</p>
          <button
            type="submit"
            disabled={saving}
            className={`ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white shadow-sm transition ${saving ? 'opacity-60' : 'hover:opacity-95'}`}
          >
            {saving ? 'Sending...' : 'Send inquiry'}
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import React, { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export default function InquiryForm({ providerSlug }: { providerSlug: string }) {
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
    <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border bg-white p-3">
      {sent ? <div className="rounded-lg border border-green-200 bg-green-50 p-2 text-sm text-green-800">Message sent!</div> : null}

      {error ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-1">
        <label htmlFor="name" className="text-xs font-medium text-gray-700">
          Name *
        </label>
        <input id="name" name="name" required disabled={saving} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Jane" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <label htmlFor="email" className="text-xs font-medium text-gray-700">
            Email *
          </label>
          <input id="email" name="email" type="email" required disabled={saving} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="you@cafe.com" />
        </div>

        <div className="grid gap-1">
          <label htmlFor="phone" className="text-xs font-medium text-gray-700">
            Phone
          </label>
          <input id="phone" name="phone" disabled={saving} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Optional" />
        </div>
      </div>

      <div className="grid gap-1">
        <label htmlFor="message" className="text-xs font-medium text-gray-700">
          Message *
        </label>
        <textarea id="message" name="message" required rows={3} disabled={saving} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="What do you need help with?" />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">* required</p>
        <button type="submit" disabled={saving} className={`rounded-lg bg-black px-3 py-2 text-sm font-medium text-white ${saving ? 'opacity-60' : 'hover:opacity-90'}`}>
          {saving ? 'Sending…' : 'Send'}
        </button>
      </div>
    </form>
  );
}

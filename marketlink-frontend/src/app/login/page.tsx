'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
// If your backend path uses /api/auth/magic-link instead, just change ENDPOINT below.
const ENDPOINT = `${API_BASE}/auth/magic-link`;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Request failed (${res.status})`);
      }

      setStatus('success');
      setMessage('Magic link requested. In development, check your backend console for the token.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Something went wrong.');
    }
  }

  const disabled = status === 'loading' || !email || !/^\S+@\S+\.\S+$/.test(email);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-2 text-gray-600">Enter your email to receive a one-time magic link.</p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
        <input type="email" name="email" placeholder="you@business.com" className="w-full rounded-xl border px-4 py-3" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />

        <button type="submit" disabled={disabled} className={`rounded-xl border px-4 py-3 font-medium ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
          {status === 'loading' ? 'Sending...' : 'Send magic link'}
        </button>

        {message ? <div className={`text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message}</div> : null}

        <p className="text-xs text-gray-500">Note: In dev, we won’t send real emails. The backend will log a token.</p>
      </form>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo, useState } from 'react';

type LoginResponse = { ok: true } | { ok: false; message?: string } | Record<string, unknown>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => {
    const n = searchParams.get('next');
    // Basic safety: only allow internal redirects
    if (n && n.startsWith('/')) return n;
    return '/dashboard';
  }, [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      let data: LoginResponse | null = null;
      try {
        data = (await res.json()) as LoginResponse;
      } catch {
        // ok if backend returns empty
      }

      if (!res.ok) {
        const msg = (data as any)?.message || (res.status === 401 ? 'Invalid email or password.' : 'Login failed.');
        setError(msg);
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="mt-2 text-sm text-gray-600">Provider / Admin portal access.</p>

      <form onSubmit={onSubmit} className="mt-8 grid gap-4">
        <div className="grid gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border px-4 py-3"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div className="grid gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-xl border px-4 py-3"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={submitting} className="rounded-xl bg-black px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-60">
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="flex items-center justify-between text-sm">
          <Link href="/" className="text-gray-700 hover:underline underline-offset-4">
            Continue as guest
          </Link>
          <Link href={`/providers`} className="text-gray-700 hover:underline underline-offset-4">
            View providers
          </Link>
        </div>
      </form>
    </main>
  );
}

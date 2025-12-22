'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

type LoginResponse =
  | { ok: true; user?: { mustChangePassword?: boolean }; expiresAt?: string }
  | { ok: false; message?: string }
  | Record<string, unknown>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const nextPath = useMemo(() => {
    const n = searchParams.get('next');
    if (n && n.startsWith('/')) return n;
    return '/dashboard';
  }, [searchParams]);

  const [checkingSession, setCheckingSession] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // If user already has a valid session cookie, don’t show login page.
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!cancelled && res.ok) {
          router.replace(nextPath);
          router.refresh();
          return;
        }
      } catch {
        // ignore and show login form
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [API_BASE, nextPath, router]);

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

      // Successful login: go where we intended
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-2 text-sm text-gray-600">Checking your session…</p>
      </main>
    );
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

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-black px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="flex items-center justify-between text-sm">
          <Link href="/" className="text-gray-700 hover:underline underline-offset-4">
            Continue as guest
          </Link>
          <Link href="/providers" className="text-gray-700 hover:underline underline-offset-4">
            View providers
          </Link>
        </div>
      </form>
    </main>
  );
}

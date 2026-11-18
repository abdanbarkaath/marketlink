'use client';

import AccountPage, { accountFieldClass, accountSubmitClass } from '@/components/AccountPage';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

type MeSummaryResponse =
  | {
      user: { id: string; email: string; role: 'provider' | 'customer' | 'admin' };
    }
  | { error?: string }
  | Record<string, unknown>;

type SignupResponse = { ok: true; user?: { mustChangePassword?: boolean }; expiresAt?: string } | { ok: false; message?: string } | Record<string, unknown>;

function safeInternalPath(raw: string | null | undefined, fallback: string) {
  const v = (raw || '').trim();
  if (!v || !v.startsWith('/')) return fallback;
  if (v.startsWith('//')) return fallback;
  return v;
}

function pickRedirect(role: 'provider' | 'customer' | 'admin', desiredPath: string) {
  if (role === 'admin') {
    return desiredPath.startsWith('/dashboard/admin') ? desiredPath : '/dashboard/admin';
  }
  if (role === 'customer') {
    return desiredPath.startsWith('/dashboard/customer') ? desiredPath : '/dashboard/customer';
  }
  if (desiredPath.startsWith('/dashboard/admin')) return '/dashboard';
  return desiredPath;
}

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const desiredPath = useMemo(() => {
    const returnTo = searchParams.get('returnTo');
    const next = searchParams.get('next');
    return safeInternalPath(returnTo ?? next, '/dashboard/customer');
  }, [searchParams]);

  const [checkingSession, setCheckingSession] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchRoleAndRedirect = useCallback(async () => {
    const res = await fetch(`${API_BASE}/me/summary`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) return false;

    const data = (await res.json().catch(() => ({}))) as MeSummaryResponse;
    const role = (data as { user?: { role?: 'provider' | 'customer' | 'admin' } })?.user?.role;
    if (!role) return false;

    const target = pickRedirect(role, desiredPath);
    router.replace(target);
    router.refresh();
    return true;
  }, [API_BASE, desiredPath, router]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const didRedirect = await fetchRoleAndRedirect();
        if (didRedirect) return;
      } catch {
        // ignore and show signup form
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchRoleAndRedirect]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    if (!cleanName || !cleanEmail || !cleanPassword || !cleanConfirmPassword) {
      setError('Enter your name, email, password, and confirm password.');
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password: cleanPassword }),
      });

      let data: SignupResponse | null = null;
      try {
        data = (await res.json()) as SignupResponse;
      } catch {
        // ok if backend returns empty
      }

      if (!res.ok) {
        const msg = (data as { message?: string } | null)?.message || 'Could not create the account.';
        setError(msg);
        return;
      }

      const didRedirect = await fetchRoleAndRedirect();
      if (!didRedirect) {
        router.replace('/dashboard/customer');
        router.refresh();
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return <AccountPage mode="signup" status="Checking your session..." />;
  }

  return (
    <AccountPage mode="signup">
      <form onSubmit={onSubmit} className="grid gap-4" aria-busy={submitting}>
        <div className="grid gap-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            className={accountFieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={accountFieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            className={accountFieldClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">
            Confirm password
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={accountFieldClass}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        {error ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <button type="submit" disabled={submitting} className={accountSubmitClass}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AccountPage>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<AccountPage mode="signup" status="Loading sign up..." />}>
      <SignupPageContent />
    </Suspense>
  );
}

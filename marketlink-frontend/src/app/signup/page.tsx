'use client';

import Link from 'next/link';
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

function SignupLoadingState({ message }: { message: string }) {
  return (
    <main className="ml-page-bg min-h-[calc(100vh-80px)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="ml-card rounded-[2rem] px-6 py-8 shadow-[0_18px_48px_rgba(23,26,31,0.08)]">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create account</h1>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
        </div>
      </div>
    </main>
  );
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

  const fieldClass = 'ml-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900';

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
    return <SignupLoadingState message="Checking your session..." />;
  }

  return (
    <main className="ml-page-bg min-h-[calc(100vh-80px)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_520px]">
          <div className="ml-dark-panel order-2 overflow-hidden rounded-[2rem] shadow-[0_30px_90px_rgba(23,26,31,0.22)] lg:order-1">
            <div className="h-2 bg-[linear-gradient(90deg,#0f172a,#25324a,#b6bdc8)]" />
            <div className="bg-[radial-gradient(120%_120%_at_0%_0%,rgba(148,163,184,0.16),transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.90))] px-5 py-6 sm:px-8 sm:py-10">
              <div className="inline-flex items-center rounded-xl border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-white/65">
                Looking for experts?
              </div>
              <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.05em] text-white sm:mt-5 sm:text-5xl">
                Create your account first, then keep the rest lightweight.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200/78 sm:mt-4 sm:text-base sm:leading-7">
                We only need your name, email, and password here. Heavier business details should wait until you actually request help or start a conversation.
              </p>

              <div className="mt-5 grid gap-3 sm:mt-8 sm:grid-cols-2">
                <div className="rounded-[1.3rem] border border-white/10 bg-white/6 px-4 py-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">Looking for experts?</div>
                  <div className="mt-2 text-sm font-semibold text-white">Minimal first step</div>
                  <p className="mt-2 text-sm leading-6 text-slate-200/72">After sign up, MarketLink will route you straight into the customer area with only the minimum setup.</p>
                </div>
                <div className="rounded-[1.3rem] border border-white/10 bg-white/6 px-4 py-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">Already an expert?</div>
                  <div className="mt-2 text-sm font-semibold text-white">Use sign in instead</div>
                  <p className="mt-2 text-sm leading-6 text-slate-200/72">If you already have an expert or admin account, do not create a new account here. Use your existing login instead.</p>
                  <div className="mt-4">
                    <Link href="/login" className="inline-flex w-full justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 sm:w-auto">
                      Go to sign in
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="ml-card order-1 rounded-[2rem] px-5 py-6 shadow-[0_18px_48px_rgba(23,26,31,0.08)] sm:px-8 sm:py-10 lg:order-2">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-5">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Get started</div>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900">Create account</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Start with the basics only. You can add optional business details later.</p>
              </div>
              <span className="ml-pill rounded-xl px-4 py-2 text-sm font-medium normal-case tracking-normal">Simple</span>
            </div>

            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className={fieldClass}
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
                  className={fieldClass}
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
                  className={fieldClass}
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
                  className={fieldClass}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              {error ? (
                <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600">Already have an account? Use sign in instead.</div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="ml-btn-primary inline-flex min-h-11 w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
                >
                  {submitting ? 'Creating...' : 'Create account'}
                </button>
              </div>

              <div className="flex flex-col gap-2 pt-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <Link href="/login" className="font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900">
                  Already have an account? Sign in
                </Link>
                <Link href="/experts" className="font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900">
                  Browse experts
                </Link>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoadingState message="Loading sign up..." />}>
      <SignupPageContent />
    </Suspense>
  );
}

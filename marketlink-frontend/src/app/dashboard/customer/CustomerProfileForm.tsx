'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type CustomerProfileFormProps = {
  email: string;
  initialName?: string | null;
  initialBusinessName?: string | null;
  mode: 'onboarding' | 'profile';
};

export default function CustomerProfileForm({ email, initialName, initialBusinessName, mode }: CustomerProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? '');
  const [businessName, setBusinessName] = useState(initialBusinessName ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shellClass = 'ml-card rounded-xl p-5 sm:p-6';
  const fieldClass = 'ml-input min-h-12 w-full px-3 py-2 text-base';
  const primaryButtonClass = 'ml-btn-primary inline-flex items-center justify-center px-6 text-sm font-bold disabled:opacity-60';
  const secondaryLinkClass = 'ml-btn-secondary inline-flex items-center justify-center px-5 text-sm font-semibold';
  const nextPath = mode === 'onboarding' ? '/dashboard/customer' : '/dashboard/customer/profile';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanBusinessName = businessName.trim();

    if (!cleanName) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/me/customer-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: cleanName,
          businessName: cleanBusinessName,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || `Failed (${res.status})`);
      }

      router.replace(nextPath);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="dashboard-intro p-5 sm:p-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {mode === 'onboarding' ? 'Finish the basics' : 'Your customer profile'}
        </h1>
        <p className="dashboard-intro-copy mt-2 text-sm leading-6">
          {mode === 'onboarding'
            ? 'Add your name to finish setting up your MarketLink account.'
            : 'Update the name and business details on your account.'}
        </p>
      </header>

      <div className="mt-5 grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_17rem]">
        <section className={shellClass} aria-labelledby="customer-details">
          <h2 id="customer-details" className="text-lg font-bold text-[#192a48]">Personal details</h2>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-5" aria-busy={saving}>
            <div className="grid gap-2">
              <label htmlFor="customer-name" className="text-sm font-medium text-slate-700">
                Name *
              </label>
              <input
                id="customer-name"
                name="name"
                className={fieldClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="customer-business-name" className="text-sm font-medium text-slate-700">
                Business name <span className="font-normal text-slate-600">(optional)</span>
              </label>
              <input
                id="customer-business-name"
                name="businessName"
                className={fieldClass}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                autoComplete="organization"
              />
            </div>

            {error ? (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">* Required</p>
              <button type="submit" disabled={saving || !name.trim()} className={primaryButtonClass}>
                {saving ? 'Saving...' : mode === 'onboarding' ? 'Save and continue' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>

        <aside className={shellClass} aria-labelledby="customer-account">
          <h2 id="customer-account" className="text-lg font-bold text-[#192a48]">Account</h2>
          <p className="mt-2 break-all text-sm text-slate-600">{email}</p>

          <div className="mt-5 flex flex-col gap-3">
            {mode === 'profile' ? (
              <Link href="/dashboard/customer" className="dashboard-back">Back to dashboard</Link>
            ) : null}
            <Link href="/experts" className={secondaryLinkClass}>
              Browse experts
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

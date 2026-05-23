'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMarketLinkTheme } from '@/components/ThemeToggle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type CustomerProfileFormProps = {
  email: string;
  initialName?: string | null;
  initialBusinessName?: string | null;
  mode: 'onboarding' | 'profile';
};

export default function CustomerProfileForm({ email, initialName = '', initialBusinessName = '', mode }: CustomerProfileFormProps) {
  const router = useRouter();
  const { t } = useMarketLinkTheme();
  const [name, setName] = useState(initialName);
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shellClass = 'ml-card rounded-[28px] p-5 shadow-[0_18px_50px_rgba(23,26,31,0.06)] sm:p-6';
  const mutedCardClass = 'ml-surface-muted rounded-2xl p-4';
  const fieldClass = 'ml-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900';
  const primaryButtonClass = 'ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white disabled:opacity-60';
  const secondaryLinkClass = 'ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900';

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

      router.replace('/dashboard/customer/profile');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={`${t.pageBg} min-h-[calc(100vh-72px)]`}>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_320px]">
          <section className={`${shellClass} order-1 overflow-hidden`}>
            <div className="h-1.5 bg-[linear-gradient(90deg,#0f172a,#25324a,#b6bdc8)] -mx-5 -mt-5 mb-5 sm:-mx-6 sm:-mt-6 sm:mb-6" />
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Your account</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {mode === 'onboarding' ? 'Finish the basics' : 'Your customer profile'}
              </h1>
              <p className={`max-w-2xl text-sm leading-6 ${t.mutedText}`}>
                {mode === 'onboarding'
                  ? 'Keep this lightweight. Add your name now so MarketLink knows who is signed in. Business details stay optional until you actually request help or start a conversation.'
                  : 'This stays intentionally simple. Update the basics here, then add more context later only when a real request or message flow needs it.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
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
                  Business name
                </label>
                <input
                  id="customer-business-name"
                  name="businessName"
                  className={fieldClass}
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  autoComplete="organization"
                />
                <p className={`text-xs ${t.mutedText}`}>Optional. Add it now only if it helps you keep your account organized.</p>
              </div>

              {error ? (
                <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className={`text-xs ${t.mutedText}`}>* required</p>
                <button type="submit" disabled={saving || !name.trim()} className={primaryButtonClass}>
                  {saving ? 'Saving...' : mode === 'onboarding' ? 'Save and continue' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>

          <aside className={`${shellClass} order-2 lg:sticky lg:top-6 lg:self-start`}>
            <div className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Account</div>
            <div className="mt-3 text-sm font-medium text-slate-900 break-all">{email}</div>

            <div className="mt-5 grid gap-3">
              <div className={mutedCardClass}>
                <div className="text-sm font-semibold text-slate-900">Keep it light</div>
                <p className={`mt-1 text-sm ${t.mutedText}`}>No long business onboarding here. Just the basics needed for a signed-in customer account.</p>
              </div>
              <div className={mutedCardClass}>
                <div className="text-sm font-semibold text-slate-900">Add more later</div>
                <p className={`mt-1 text-sm ${t.mutedText}`}>Location, budget, and request details should be collected later inside actual request or messaging flows.</p>
              </div>
            </div>

            <div className="mt-5">
              <Link href="/experts" className={secondaryLinkClass}>
                Browse experts
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

'use client';

import React, { useEffect, useState, use } from 'react';
import { notFound } from 'next/navigation';
import InquiryForm from './InquiryForm';
import { useMarketLinkTheme } from '../../../components/ThemeToggle';

type Provider = {
  id: string;
  slug: string;
  businessName: string;
  email: string;
  tagline: string | null;
  city: string;
  state: string;
  zip: string | null;
  services: string[];
  rating: number | null;
  verified: boolean;
  logo: string | null;
  status: 'active' | 'pending' | 'disabled';
  disabledReason: string | null;
  createdAt: string;
  updatedAt: string;
};

type PageProps = {
  params: { slug: string };
};

export default function ProviderPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProvider() {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
        const res = await fetch(`${API_BASE}/providers/${resolvedParams.slug}`);
        if (res.status === 404) {
          notFound();
        }
        if (!res.ok) {
          throw new Error(`Failed to load provider: ${res.status}`);
        }
        const data = await res.json();
        setProvider(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchProvider();
  }, [resolvedParams.slug]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-8">Loading...</div>;
  }

  if (error || !provider) {
    return <div className="mx-auto max-w-4xl px-4 py-8">Error: {error}</div>;
  }

  return <ProviderPageContent provider={provider} />;
}

function ProviderPageContent({ provider: p }: { provider: Provider }) {
  const { t } = useMarketLinkTheme();

  return (
    <main className={`${t.pageBg} min-h-[calc(100vh-72px)]`}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col gap-6">
          {p.status !== 'active' && (
            <div className={`rounded-2xl ${t.surfaceMuted} ${t.border} border p-4 shadow-[0_14px_45px_rgba(2,6,23,0.08)]`}>
              <div className="font-medium text-amber-900">{p.status === 'disabled' ? 'Your listing is disabled' : 'Your listing is pending approval'}</div>
              {p.disabledReason && (
                <div className="mt-1 text-sm text-amber-800">
                  <span className="font-medium">Reason:</span> {p.disabledReason}
                </div>
              )}
              <div className="mt-2 text-xs text-amber-800">Only you can see this until it's active.</div>
            </div>
          )}

          <header className={`flex items-start gap-4 rounded-2xl ${t.surface} ${t.border} border p-6 shadow-[0_14px_45px_rgba(2,6,23,0.08)] backdrop-blur`}>
            {p.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.logo} alt={p.businessName} className="h-16 w-16 rounded-xl border object-cover shadow-sm" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-gray-50 text-sm text-gray-400 shadow-sm">Logo</div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-slate-900">{p.businessName}</h1>
              <div className={`mt-2 text-sm ${t.mutedText}`}>
                {p.city}, {p.state} · {p.verified ? 'Verified' : 'Unverified'}
              </div>
              {p.tagline && <div className="mt-2 text-lg text-slate-700">{p.tagline}</div>}
            </div>
          </header>

          <section className={`rounded-2xl ${t.surface} ${t.border} border p-6 shadow-[0_14px_45px_rgba(2,6,23,0.08)] backdrop-blur`}>
            <h2 className="text-lg font-semibold text-slate-900">Services</h2>
            {p.services.length ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {p.services.map((s) => (
                  <span key={s} className={`rounded-full border ${t.border} px-3 py-1.5 text-sm font-medium ${t.mutedText} shadow-sm`}>
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <div className={`mt-4 text-sm ${t.mutedText}`}>No services listed yet.</div>
            )}
          </section>

          <section className={`rounded-2xl ${t.surface} ${t.border} border p-6 shadow-[0_14px_45px_rgba(2,6,23,0.08)] backdrop-blur`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
              {p.status !== 'active' && <span className={`text-sm ${t.mutedText}`}>Available when active</span>}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 md:items-start">
              <div className={`rounded-xl ${t.surfaceMuted} ${t.border} border p-4 shadow-sm`}>
                <div className={`text-sm font-medium ${t.mutedText}`}>Email</div>
                <div className="mt-2 break-all text-slate-900">{p.email}</div>
                {p.zip && (
                  <>
                    <div className={`mt-4 text-sm font-medium ${t.mutedText}`}>ZIP</div>
                    <div className="mt-1 text-slate-900">{p.zip}</div>
                  </>
                )}
              </div>

              {p.status === 'active' ? <InquiryForm providerSlug={p.slug} /> : <div className={`text-sm ${t.mutedText}`}>Contact form will be available once this listing is active.</div>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

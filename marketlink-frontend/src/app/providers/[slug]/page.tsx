import React from 'react';
import { notFound } from 'next/navigation';
import { apiFetch } from '../../../lib/serverApi';
import InquiryForm from './InquiryForm';

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
  // If your Next version complains about awaiting params/searchParams,
  // change these to Promise<...> and await them.
  params: { slug: string };
};

export default async function ProviderPage({ params }: PageProps) {
  const res = await apiFetch(`/providers/${params.slug}`);
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load provider: ${res.status}`);

  const p = (await res.json()) as Provider;

  const ownerBanner = p.status !== 'active';

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {ownerBanner ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="font-medium text-amber-900">{p.status === 'disabled' ? 'Your listing is disabled' : 'Your listing is pending approval'}</div>
          {p.disabledReason ? (
            <div className="mt-1 text-sm text-amber-800">
              <span className="font-medium">Reason:</span> {p.disabledReason}
            </div>
          ) : null}
          <div className="mt-2 text-xs text-amber-800">Only you can see this until it’s active.</div>
        </div>
      ) : null}

      <header className="flex items-start gap-4">
        {p.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.logo} alt={p.businessName} className="h-14 w-14 rounded-xl border object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-gray-50 text-xs text-gray-400">Logo</div>
        )}

        <div>
          <h1 className="text-2xl font-semibold">{p.businessName}</h1>
          <div className="mt-1 text-sm text-gray-600">
            {p.city}, {p.state} · {p.verified ? 'Verified' : 'Unverified'}
          </div>
          {p.tagline ? <div className="mt-1 text-gray-700">{p.tagline}</div> : null}
        </div>
      </header>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-medium text-gray-700">Services</h2>
        {p.services.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {p.services.map((s) => (
              <span key={s} className="rounded-full border px-2 py-1 text-xs text-gray-700">
                {s}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-2 text-sm text-gray-500">No services listed yet.</div>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">Contact</h2>
          {p.status !== 'active' ? <span className="text-xs text-gray-500">Available when active</span> : null}
        </div>

        <div className="mt-3 grid gap-4 md:grid-cols-2 md:items-start">
          <div className="rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
            <div className="text-xs font-medium text-gray-600">Email</div>
            <div className="mt-1 break-all">{p.email}</div>
            {p.zip ? (
              <>
                <div className="mt-3 text-xs font-medium text-gray-600">ZIP</div>
                <div className="mt-1">{p.zip}</div>
              </>
            ) : null}
          </div>

          {p.status === 'active' ? <InquiryForm providerSlug={p.slug} /> : <div className="text-sm text-gray-500">Contact form will be available once this listing is active.</div>}
        </div>
      </section>
    </div>
  );
}

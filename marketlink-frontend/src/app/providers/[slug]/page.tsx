import React from 'react';
import { notFound } from 'next/navigation';
import { apiFetch } from '../../../lib/serverApi';

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

export default async function ProviderPage({ params }: { params: { slug: string } }) {
  const res = await apiFetch(`/providers/${params.slug}`);
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load provider: ${res.status}`);
  const p = (await res.json()) as Provider;

  const ownerBanner = p.status !== 'active';

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      {ownerBanner && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="font-medium text-amber-900">{p.status === 'disabled' ? 'Your listing is disabled' : 'Your listing is pending approval'}</div>
          {p.disabledReason && (
            <div className="mt-1 text-sm text-amber-800">
              <span className="font-medium">Reason:</span> {p.disabledReason}
            </div>
          )}
          <div className="mt-2 text-xs text-amber-800">Only you can see this until it’s active.</div>
        </div>
      )}

      <header className="flex items-start gap-4">
        {p.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.logo} alt={p.businessName} className="h-16 w-16 rounded-xl border object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-gray-50 text-gray-400">Logo</div>
        )}
        <div>
          <h1 className="text-2xl font-semibold">{p.businessName}</h1>
          <div className="mt-1 text-sm text-gray-600">
            {p.city}, {p.state} · {p.verified ? 'Verified' : 'Unverified'}
          </div>
          {p.tagline && <div className="mt-1 text-gray-700">{p.tagline}</div>}
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
        <h2 className="text-sm font-medium text-gray-700">Contact</h2>
        <div className="mt-2 text-sm text-gray-700">
          <div>Email: {p.email}</div>
          {p.zip && <div>ZIP: {p.zip}</div>}
        </div>
      </section>
    </div>
  );
}

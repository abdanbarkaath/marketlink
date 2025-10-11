// app/providers/page.tsx
import Link from 'next/link';
import React from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type SearchParams = {
  name?: string;
  city?: string;
  service?: string;
  minRating?: string;
  verified?: string; // "1" when checked
};

async function getProviders(sp: SearchParams) {
  const qp = new URLSearchParams();
  if (sp.name) qp.set('name', sp.name);
  if (sp.city) qp.set('city', sp.city);
  if (sp.service) qp.set('service', sp.service);
  if (sp.minRating) qp.set('minRating', sp.minRating);
  if (sp.verified) qp.set('verified', sp.verified);

  const url = `${API_BASE}/providers?${qp.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch providers: ${res.status}`);
  return res.json();
}

export default async function ProvidersPage({ searchParams }: { searchParams: SearchParams }) {
  const providers = await getProviders(searchParams || {});
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Providers</h1>
      <p className="text-sm text-gray-600">
        Showing {providers.length} result{providers.length === 1 ? '' : 's'}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((p: any) => (
          <Link
            key={p.id}
            href={`/providers/${p.slug}`}
            prefetch={true} // ← this triggers background pre-rendering
            className="rounded-xl border p-4 block hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.logo ?? 'https://placehold.co/80x80'} alt={p.businessName} className="h-12 w-12 rounded-lg object-cover" />
              <div>
                <h2 className="font-medium">{p.businessName}</h2>
                <p className="text-sm text-gray-600">
                  {p.city}, {p.state} • ⭐ {p.rating ?? '—'}
                  {p.verified ? ' • Verified' : ''}
                </p>
              </div>
            </div>

            {p.tagline ? <p className="mt-3 text-sm text-gray-700">{p.tagline}</p> : null}

            {Array.isArray(p.services) && p.services.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {p.services.map((s: string) => (
                  <span key={s} className="rounded-full border px-2 py-0.5 text-xs">
                    {s}
                  </span>
                ))}
              </div>
            ) : null}
          </Link>
        ))}
      </div>
    </main>
  );
}

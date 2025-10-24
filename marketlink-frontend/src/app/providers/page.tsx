// marketlink-frontend/src/app/providers/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Providers | Marketlink',
};

type Provider = {
  id: string;
  slug: string;
  businessName: string;
  tagline: string | null;
  city: string;
  state: string;
  verified: boolean;
  logo: string | null;
  services: string[];
  rating: number;
  createdAt: string;
};

type ProvidersResponse = {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    sort: 'newest' | 'name' | 'rating' | 'verified';
    order: 'asc' | 'desc';
  };
  data: Provider[];
};

function toQS(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && String(v).trim() !== '') usp.set(k, String(v));
  });
  return usp.toString();
}

// Build a compact page number list like [1, '…', 5, 6, 7, '…', 12]
function buildPageWindow(current: number, total: number, span = 5): (number | string)[] {
  const pages: (number | string)[] = [];
  const start = Math.max(1, current - Math.floor(span / 2));
  const end = Math.min(total, start + span - 1);
  const adjStart = Math.max(1, Math.min(start, Math.max(1, total - span + 1)));
  const adjEnd = Math.min(total, Math.max(end, Math.min(total, span)));

  if (adjStart > 1) {
    pages.push(1);
    if (adjStart > 2) pages.push('…');
  }
  for (let p = adjStart; p <= adjEnd; p++) pages.push(p);
  if (adjEnd < total) {
    if (adjEnd < total - 1) pages.push('…');
    pages.push(total);
  }
  return pages;
}

export default async function ProvidersPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  // Existing filters
  const name = typeof searchParams.name === 'string' ? searchParams.name : undefined;
  const city = typeof searchParams.city === 'string' ? searchParams.city : undefined;
  const service = typeof searchParams.service === 'string' ? searchParams.service : undefined; // comma-separated
  const match = (typeof searchParams.match === 'string' ? searchParams.match : 'any') as 'any' | 'all';
  const minRating = typeof searchParams.minRating === 'string' ? searchParams.minRating : undefined;
  const verified = typeof searchParams.verified === 'string' ? searchParams.verified : undefined;

  // Sorting + pagination
  const sort = (typeof searchParams.sort === 'string' ? searchParams.sort : 'newest') as 'newest' | 'name' | 'rating' | 'verified';
  const order = (typeof searchParams.order === 'string' ? searchParams.order : undefined) as 'asc' | 'desc' | undefined;
  const page = Math.max(1, parseInt(String(searchParams.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(searchParams.limit ?? '20'), 10) || 20));

  const qs = toQS({
    name,
    city,
    service,
    match,
    minRating,
    verified,
    sort,
    order,
    page: String(page),
    limit: String(limit),
  });

  const apiBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  const res = await fetch(`${apiBase}/providers?${qs}`, {
    cache: 'no-store',
    headers: { 'content-type': 'application/json' },
  });

  if (!res.ok) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Providers</h1>
        <p className="text-red-600">Failed to load providers.</p>
      </main>
    );
  }

  const payload = (await res.json()) as ProvidersResponse;
  const { meta, data } = payload;
  const { total, totalPages } = meta;

  // Helpers for pagination links that preserve current filters/sorting
  const baseParams = {
    name,
    city,
    service,
    match,
    minRating,
    verified,
    sort,
    order,
    limit: String(limit),
  };

  const prevParams = toQS({ ...baseParams, page: String(Math.max(1, page - 1)) });
  const nextParams = toQS({ ...baseParams, page: String(Math.min(totalPages, page + 1)) });
  const pageWindow = buildPageWindow(page, totalPages, 5);

  // Utilities to generate links with overridden params
  const linkWith = (extra: Record<string, string | undefined>) => `/providers?${toQS({ ...baseParams, page: String(page), ...extra })}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Providers</h1>
          <p className="text-sm text-gray-500">
            {total} result{total === 1 ? '' : 's'} · Page {meta.page} of {meta.totalPages}
          </p>
        </div>

        {/* Sorting bar (GET) */}
        <form method="GET" className="flex flex-wrap items-end gap-3">
          {/* Preserve current filters */}
          {name ? <input type="hidden" name="name" value={name} /> : null}
          {city ? <input type="hidden" name="city" value={city} /> : null}
          {service ? <input type="hidden" name="service" value={service} /> : null}
          <input type="hidden" name="match" value={match} />
          {minRating ? <input type="hidden" name="minRating" value={minRating} /> : null}
          {verified ? <input type="hidden" name="verified" value={verified} /> : null}
          <input type="hidden" name="page" value="1" />
          <label className="text-sm font-medium">
            Page size
            <select name="limit" defaultValue={String(limit)} className="ml-2 rounded border px-2 py-1 text-sm">
              <option value="12">12</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Sort
            <select name="sort" defaultValue={sort} className="ml-2 rounded border px-2 py-1 text-sm">
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="rating">Rating</option>
              <option value="verified">Verified</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Order
            <select name="order" defaultValue={order ?? (sort === 'name' ? 'asc' : 'desc')} className="ml-2 rounded border px-2 py-1 text-sm">
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </label>

          <button type="submit" className="rounded bg-black text-white text-sm px-3 py-1">
            Apply
          </button>
        </form>
      </div>

      {/* Filters bar */}
      <form method="GET" className="flex flex-wrap items-end gap-3 rounded border p-3 mb-4">
        {/* Preserve sorting/pagination when changing filters */}
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="order" value={order ?? (sort === 'name' ? 'asc' : 'desc')} />
        <input type="hidden" name="limit" value={String(limit)} />
        <input type="hidden" name="page" value="1" />

        {/* Existing filters that might be set elsewhere */}
        {name ? <input type="hidden" name="name" value={name} /> : null}
        {city ? <input type="hidden" name="city" value={city} /> : null}

        {/* Services + match */}
        <label className="text-sm font-medium">
          Services
          <input type="text" name="service" defaultValue={service ?? ''} placeholder="e.g. seo,ads,social" className="ml-2 rounded border px-2 py-1 text-sm w-64" />
        </label>

        <label className="text-sm font-medium">
          Match
          <select name="match" defaultValue={match} className="ml-2 rounded border px-2 py-1 text-sm">
            <option value="any">Any</option>
            <option value="all">All</option>
          </select>
        </label>

        {/* Verified-only toggle */}
        <label className="text-sm font-medium flex items-center gap-2">
          <input type="checkbox" name="verified" value="1" defaultChecked={verified === '1' || (verified ?? '').toLowerCase() === 'true'} />
          Verified only
        </label>

        {/* Min rating quick presets */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-500">Min rating:</span>
          {[
            { label: 'None', value: '' },
            { label: '3.0★', value: '3.0' },
            { label: '4.0★', value: '4.0' },
            { label: '4.5★', value: '4.5' },
          ].map((opt) => {
            const isActive = (!minRating && opt.value === '') || (minRating && opt.value === minRating);
            const href = `/providers?${toQS({
              ...{
                name,
                city,
                service,
                match,
                verified,
                sort,
                order,
                limit: String(limit),
                page: '1',
              },
              minRating: opt.value || undefined,
            })}`;
            return (
              <Link key={opt.label} href={href} className={`rounded border px-2 py-1 text-xs ${isActive ? 'bg-black text-white border-black' : 'hover:bg-gray-50'}`}>
                {opt.label}
              </Link>
            );
          })}
        </div>

        <button type="submit" className="rounded bg-black text-white text-sm px-3 py-1">
          Filter
        </button>
      </form>

      {/* Results grid */}
      {data.length === 0 ? (
        <div className="rounded border p-6 text-center text-gray-600">No providers found. Try adjusting filters.</div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((p) => {
            const topServices = (p.services ?? []).slice(0, 3);
            const overflow = Math.max(0, (p.services?.length ?? 0) - topServices.length);
            return (
              <li key={p.id} className="rounded-xl border p-4 hover:shadow-sm transition">
                <Link href={`/providers/${p.slug}`} className="block">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded bg-gray-100 overflow-hidden">
                      {p.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.logo} alt={p.businessName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-xs text-gray-500">Logo</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{p.businessName}</h3>
                        {p.verified ? <span className="text-[10px] rounded bg-green-100 text-green-700 px-1.5 py-0.5">Verified</span> : null}
                      </div>
                      <p className="text-xs text-gray-500">
                        {p.city}, {p.state}
                      </p>
                    </div>
                  </div>

                  {/* Tagline */}
                  {p.tagline ? <p className="mt-3 text-sm text-gray-700 line-clamp-2">{p.tagline}</p> : null}

                  {/* Services chips */}
                  {topServices.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1" title={p.services?.join(', ')}>
                      {topServices.map((s) => (
                        <span key={s} className="text-[10px] uppercase tracking-wide rounded-full border px-2 py-0.5 text-gray-700 bg-gray-50">
                          {s}
                        </span>
                      ))}
                      {overflow > 0 ? <span className="text-[10px] rounded-full border px-2 py-0.5 text-gray-500 bg-white">+{overflow} more</span> : null}
                    </div>
                  ) : null}

                  {/* Footer: rating + createdAt */}
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-600">⭐ {p.rating?.toFixed?.(1) ?? '0.0'}</span>
                    <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      <div className="mt-8 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
        </div>
        <div className="flex items-center gap-1">
          <Link aria-disabled={page <= 1} className={`px-3 py-1 rounded border text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`} href={`/providers?${prevParams}`}>
            ← Prev
          </Link>

          {pageWindow.map((p, i) =>
            typeof p === 'number' ? (
              <Link
                key={`${p}-${i}`}
                href={`/providers?${toQS({ ...baseParams, page: String(p) })}`}
                className={`px-3 py-1 rounded border text-sm ${p === page ? 'bg-black text-white border-black' : 'hover:bg-gray-50'}`}
              >
                {p}
              </Link>
            ) : (
              <span key={`dots-${i}`} className="px-2 text-sm text-gray-400">
                {p}
              </span>
            ),
          )}

          <Link
            aria-disabled={page >= totalPages}
            className={`px-3 py-1 rounded border text-sm ${page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
            href={`/providers?${nextParams}`}
          >
            Next →
          </Link>
        </div>
      </div>
    </main>
  );
}

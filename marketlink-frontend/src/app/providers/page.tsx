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
  shortDescription?: string | null;
  city: string;
  state: string;
  verified: boolean;
  logo: string | null;
  services: string[];
  rating: number;
  hourlyRateMin?: number | null;
  hourlyRateMax?: number | null;
  minProjectBudget?: number | null;
  currencyCode?: string | null;
  createdAt: string;
};

type FiltersFormProps = {
  name?: string;
  city?: string;
  service?: string;
  match: 'any' | 'all';
  minRating?: string;
  sort: 'newest' | 'name' | 'rating' | 'verified';
  order?: 'asc' | 'desc';
  limit: number;
  verified?: string;
  compact?: boolean;
};

const FIELD_CLASS = 'ml-input w-full rounded-2xl px-4 py-3 text-sm';
const CHECKBOX_CLASS = 'ml-checkbox h-4 w-4 rounded';
const PRIMARY_BUTTON_CLASS = 'ml-btn-primary inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold shadow-sm';
const PILL_CLASS = 'ml-pill rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]';
const PILL_MUTED_CLASS = 'ml-pill-muted rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]';
const SECTION_CLASS = 'ml-card rounded-[1.8rem] px-5 py-5 shadow-[0_16px_40px_rgba(23,26,31,0.06)] sm:px-6 sm:py-6';

function FiltersForm({ name, city, service, match, minRating, sort, order, limit, verified, compact = false }: FiltersFormProps) {
  return (
    <form method="GET" className={`grid gap-4 ${compact ? '' : 'lg:grid-cols-12'}`}>
      <input type="hidden" name="page" value="1" />

      <label className={compact ? '' : 'lg:col-span-3'}>
        <span className="mb-2 block text-sm font-medium text-slate-700">Provider name</span>
        <input
          type="text"
          name="name"
          defaultValue={name ?? ''}
          placeholder="Search by business name"
          className={FIELD_CLASS}
        />
      </label>

      <label className={compact ? '' : 'lg:col-span-2'}>
        <span className="mb-2 block text-sm font-medium text-slate-700">City</span>
        <input
          type="text"
          name="city"
          defaultValue={city ?? ''}
          placeholder="Chicago"
          className={FIELD_CLASS}
        />
      </label>

      <label className={compact ? '' : 'lg:col-span-3'}>
        <span className="mb-2 block text-sm font-medium text-slate-700">Service</span>
        <input
          type="text"
          name="service"
          defaultValue={service ?? ''}
          placeholder="seo, ads, social"
          className={FIELD_CLASS}
        />
      </label>

      <label className={compact ? '' : 'lg:col-span-2'}>
        <span className="mb-2 block text-sm font-medium text-slate-700">Service match</span>
        <select
          name="match"
          defaultValue={match}
          className={FIELD_CLASS}
        >
          <option value="any">Any selected service</option>
          <option value="all">Must match all</option>
        </select>
      </label>

      <label className={compact ? '' : 'lg:col-span-2'}>
        <span className="mb-2 block text-sm font-medium text-slate-700">Minimum rating</span>
        <select
          name="minRating"
          defaultValue={minRating ?? ''}
          className={FIELD_CLASS}
        >
          <option value="">Any rating</option>
          <option value="3.0">3.0+</option>
          <option value="4.0">4.0+</option>
          <option value="4.5">4.5+</option>
        </select>
      </label>

      <label className={compact ? '' : 'lg:col-span-2'}>
        <span className="mb-2 block text-sm font-medium text-slate-700">Sort by</span>
        <select
          name="sort"
          defaultValue={sort}
          className={FIELD_CLASS}
        >
          <option value="newest">Newest</option>
          <option value="name">Name</option>
          <option value="rating">Rating</option>
          <option value="verified">Verified</option>
        </select>
      </label>

      <label className={compact ? '' : 'lg:col-span-2'}>
        <span className="mb-2 block text-sm font-medium text-slate-700">Order</span>
        <select
          name="order"
          defaultValue={order ?? (sort === 'name' ? 'asc' : 'desc')}
          className={FIELD_CLASS}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </label>

      <label className={compact ? '' : 'lg:col-span-2'}>
        <span className="mb-2 block text-sm font-medium text-slate-700">Page size</span>
        <select
          name="limit"
          defaultValue={String(limit)}
          className={FIELD_CLASS}
        >
          <option value="12">12</option>
          <option value="20">20</option>
          <option value="30">30</option>
          <option value="50">50</option>
        </select>
      </label>

      <div className={compact ? '' : 'lg:col-span-2'}>
        <span className="mb-2 block text-sm font-medium text-slate-700">Verification</span>
        <label className="ml-input flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="verified"
            value="1"
            defaultChecked={verified === '1' || (verified ?? '').toLowerCase() === 'true'}
            className={CHECKBOX_CLASS}
          />
          Verified only
        </label>
      </div>

      <div className={compact ? '' : 'lg:col-span-12'}>
        <button type="submit" className={PRIMARY_BUTTON_CLASS}>
          Apply filters
        </button>
      </div>
    </form>
  );
}

function ProviderCard({ provider }: { provider: Provider }) {
  const p = provider;
  const topServices = (p.services ?? []).slice(0, 3);
  const overflow = Math.max(0, (p.services?.length ?? 0) - topServices.length);
  const pricingLabel = p.minProjectBudget
    ? `${p.currencyCode || 'USD'} ${p.minProjectBudget}+ min`
      : p.hourlyRateMin || p.hourlyRateMax
      ? `${p.currencyCode || 'USD'} ${p.hourlyRateMin ?? ''}${p.hourlyRateMax ? `-${p.hourlyRateMax}` : '+'}/hr`
      : 'Request quote';
  const profileSummary = p.shortDescription ? p.shortDescription : p.tagline ? p.tagline : 'Explore services, profile fit, and pricing details.';
  const sinceLabel = new Date(p.createdAt).toLocaleDateString();

  return (
    <li className="ml-card ml-card-hover overflow-hidden rounded-[1.9rem] transition hover:-translate-y-0.5">
      <Link href={`/providers/${p.slug}`} className="group block">
        <div className="h-1.5 bg-[linear-gradient(90deg,#0f172a,#25324a,#b6bdc8)]" />
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="ml-surface-muted h-14 w-14 shrink-0 overflow-hidden rounded-2xl shadow-sm">
              {p.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logo} alt={p.businessName} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Logo</div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`${PILL_CLASS} px-2.5 text-[10px]`}>
                      {p.city}, {p.state}
                    </span>
                    {p.verified ? (
                      <span className={`${PILL_MUTED_CLASS} inline-flex items-center px-2.5 py-1 text-[10px]`}>
                        Verified
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Local marketing provider</div>
                  <h3 className="mt-1 truncate text-[1.2rem] font-semibold tracking-tight text-slate-900 sm:text-[1.35rem]">{p.businessName}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 sm:max-w-2xl">{profileSummary}</p>
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-2 sm:min-w-[220px]">
                  <div className="ml-surface-muted rounded-[1.15rem] px-3 py-2.5 text-right shadow-sm">
                    <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Rating</div>
                    <div className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">{p.rating?.toFixed?.(1) ?? '0.0'}</div>
                  </div>
                  <div className="ml-surface-muted rounded-[1.15rem] px-3 py-2.5 text-right shadow-sm">
                    <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Pricing</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{pricingLabel}</div>
                  </div>
                </div>
              </div>

              {topServices.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2" title={p.services.join(', ')}>
                  {topServices.map((service) => (
                    <span key={service} className={`${PILL_CLASS} px-3 text-[10px]`}>
                      {service}
                    </span>
                  ))}
                  {overflow > 0 ? (
                    <span className={`${PILL_MUTED_CLASS} px-3 text-[10px]`}>
                      +{overflow} more
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 hidden gap-3 border-t border-slate-200/80 pt-4 sm:grid sm:grid-cols-[1.05fr_0.95fr_auto] sm:items-center">
                <div className="ml-surface-muted rounded-[1.05rem] px-3 py-3">
                  <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Profile status</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{p.verified ? 'Verified profile' : 'Live listing'}</div>
                </div>
                <div className="ml-surface-muted rounded-[1.05rem] px-3 py-3">
                  <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Updated</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{sinceLabel}</div>
                </div>
                <div className="ml-dark-panel flex items-center justify-between gap-3 rounded-[1.05rem] px-4 py-3 sm:justify-center">
                  <span className="text-sm font-semibold">Open profile</span>
                  <span className="text-base transition group-hover:translate-x-1" aria-hidden="true">&rarr;</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200/80 pt-4 sm:hidden">
                <div className="min-w-0">
                  <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Updated</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{sinceLabel}</div>
                </div>
                <div className="ml-btn-primary flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white">
                  Open
                  <span className="text-base transition group-hover:translate-x-1" aria-hidden="true">&rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

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

function buildPageWindow(current: number, total: number, span = 5): (number | string)[] {
  const pages: (number | string)[] = [];
  const start = Math.max(1, current - Math.floor(span / 2));
  const end = Math.min(total, start + span - 1);
  const adjStart = Math.max(1, Math.min(start, Math.max(1, total - span + 1)));
  const adjEnd = Math.min(total, Math.max(end, Math.min(total, span)));

  if (adjStart > 1) {
    pages.push(1);
    if (adjStart > 2) pages.push('...');
  }
  for (let p = adjStart; p <= adjEnd; p++) pages.push(p);
  if (adjEnd < total) {
    if (adjEnd < total - 1) pages.push('...');
    pages.push(total);
  }
  return pages;
}

type ProvidersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProvidersPage({ searchParams }: ProvidersPageProps) {
  const resolvedSearchParams = await searchParams;

  const name = typeof resolvedSearchParams.name === 'string' ? resolvedSearchParams.name : undefined;
  const city = typeof resolvedSearchParams.city === 'string' ? resolvedSearchParams.city : undefined;
  const service = typeof resolvedSearchParams.service === 'string' ? resolvedSearchParams.service : undefined;
  const match = (typeof resolvedSearchParams.match === 'string' ? resolvedSearchParams.match : 'any') as 'any' | 'all';
  const minRating = typeof resolvedSearchParams.minRating === 'string' ? resolvedSearchParams.minRating : undefined;
  const verified = typeof resolvedSearchParams.verified === 'string' ? resolvedSearchParams.verified : undefined;

  const sort = (typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : 'newest') as 'newest' | 'name' | 'rating' | 'verified';
  const order = (typeof resolvedSearchParams.order === 'string' ? resolvedSearchParams.order : undefined) as 'asc' | 'desc' | undefined;
  const page = Math.max(1, parseInt(String(resolvedSearchParams.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(resolvedSearchParams.limit ?? '20'), 10) || 20));

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
      <main className="ml-page-bg min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="ml-card rounded-[1.8rem] px-6 py-8 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">Providers</h1>
            <p className="mt-3 text-red-600">Failed to load providers.</p>
          </div>
        </div>
      </main>
    );
  }

  const payload = (await res.json()) as ProvidersResponse;
  const { meta, data } = payload;
  const { total, totalPages } = meta;

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

  const activeFilters = [
    name ? { label: `Name: ${name}` } : null,
    city ? { label: `City: ${city}` } : null,
    service ? { label: `Service: ${service}` } : null,
    minRating ? { label: `Rating ${minRating}+` } : null,
    verified === '1' || (verified ?? '').toLowerCase() === 'true' ? { label: 'Verified only' } : null,
  ].filter(Boolean) as { label: string }[];

  return (
    <main className="ml-page-bg min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <section className={`${SECTION_CLASS} rounded-[2rem] sm:px-8 sm:py-8`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-[11px] font-medium uppercase tracking-[0.26em] text-slate-500">Provider directory</div>
              <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl">Find teams by city, fit, and service.</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Use filters to narrow the directory quickly, then open richer provider profiles to compare services, proof of work, and contact details.
              </p>
            </div>
            <div className="ml-dark-panel w-full rounded-[1.4rem] px-5 py-4 text-white sm:w-auto">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">Results</div>
              <div className="mt-2 text-2xl font-semibold">{total}</div>
              <div className="text-sm text-slate-200/78">
                Page {meta.page} of {meta.totalPages}
              </div>
            </div>
          </div>
        </section>

        <section className={`mt-6 ${SECTION_CLASS}`}>
          <details className="group md:hidden">
            <summary className="ml-surface flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.4rem] px-4 py-4 shadow-sm">
              <div className="min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Filters</div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Refine the shortlist</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {activeFilters.length > 0 ? `${activeFilters.length} active filter${activeFilters.length > 1 ? 's' : ''}` : 'Open filters to narrow the list'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="ml-btn-secondary rounded-xl px-4 py-2 text-sm font-medium normal-case tracking-normal group-open:hidden">Open</span>
                <span className="ml-btn-secondary hidden rounded-xl px-4 py-2 text-sm font-medium normal-case tracking-normal group-open:inline-flex">Close</span>
              </div>
            </summary>
            <div className="ml-surface mt-4 rounded-[1.4rem] p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-700">Set filters and apply when ready.</div>
                <Link href="/providers" className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900">
                  Clear
                </Link>
              </div>
              <FiltersForm name={name} city={city} service={service} match={match} minRating={minRating} sort={sort} order={order} limit={limit} verified={verified} compact />
            </div>
          </details>

          <div className="hidden flex-col gap-3 md:flex md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Filters</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Refine the shortlist</h2>
            </div>
            <Link href="/providers" className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900">
              Clear all filters
            </Link>
          </div>

          <div className="mt-5 hidden md:block">
            <FiltersForm name={name} city={city} service={service} match={match} minRating={minRating} sort={sort} order={order} limit={limit} verified={verified} />
          </div>
        </section>

        <section className={`mt-6 ${SECTION_CLASS}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Directory results</h2>
              <p className="mt-1 text-sm text-slate-600">
                Showing {(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
              </p>
            </div>

            {activeFilters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((item) => (
                  <span key={item.label} className={`${PILL_CLASS} px-3`}>
                    {item.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {data.length === 0 ? (
            <div className="ml-card mt-5 rounded-[1.5rem] p-8 text-center text-slate-600 shadow-[0_16px_40px_rgba(23,26,31,0.06)]">
              No providers found. Try adjusting your filters.
            </div>
          ) : (
            <ul className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {data.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </ul>
          )}
          <div className="mt-8 flex flex-col gap-4 border-t border-[rgba(var(--ml-border),0.7)] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              Page {meta.page} of {meta.totalPages}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                aria-disabled={page <= 1}
                className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium ${
                  page <= 1 ? 'pointer-events-none ml-btn-secondary text-slate-400 opacity-60' : 'ml-btn-secondary text-slate-800'
                }`}
                href={`/providers?${prevParams}`}
              >
                Prev
              </Link>

              {pageWindow.map((item, index) =>
                typeof item === 'number' ? (
                  <Link
                    key={`${item}-${index}`}
                    href={`/providers?${toQS({ ...baseParams, page: String(item) })}`}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-medium ${
                      item === page ? 'ml-btn-primary border-transparent text-white' : 'ml-btn-secondary text-slate-800'
                    }`}
                  >
                    {item}
                  </Link>
                ) : (
                  <span key={`dots-${index}`} className="px-2 text-sm text-slate-400">
                    {item}
                  </span>
                ),
              )}

              <Link
                aria-disabled={page >= totalPages}
                className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium ${
                  page >= totalPages ? 'pointer-events-none ml-btn-secondary text-slate-400 opacity-60' : 'ml-btn-secondary text-slate-800'
                }`}
                href={`/providers?${nextParams}`}
              >
                Next
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


// marketlink-frontend/src/app/experts/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getDiscoveryProblemById,
  getDiscoveryServicePathHrefForProblem,
  getDiscoveryServicePathsForProblem,
} from '@/lib/discovery';
import type { DiscoveryProblemCard } from '@/lib/discovery';
import NearbyRadiusField from '@/components/NearbyRadiusField';

export const metadata: Metadata = {
  title: 'Experts | MarketLink',
};

type Provider = {
  id: string;
  slug: string;
  businessName: string;
  expertType?: 'agency' | 'freelancer' | 'creator' | 'specialist' | null;
  tagline: string | null;
  shortDescription?: string | null;
  city: string;
  state: string;
  verified: boolean;
  logo: string | null;
  services: string[];
  creatorPlatforms?: string[];
  creatorAudienceSize?: number | null;
  creatorProofSummary?: string | null;
  rating: number;
  hourlyRateMin?: number | null;
  hourlyRateMax?: number | null;
  minProjectBudget?: number | null;
  currencyCode?: string | null;
  createdAt: string;
  distanceMiles?: number;
};

type FiltersFormProps = {
  name?: string;
  zip?: string;
  radius?: string;
  service?: string;
  problemId?: string;
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
const SECTION_CLASS = 'ml-card rounded-[1.8rem] px-5 py-5 shadow-[0_16px_40px_rgba(23,26,31,0.06)] sm:px-6 sm:py-6';

function formatExpertTypeLabel(expertType: Provider['expertType']) {
  switch (expertType) {
    case 'agency':
      return 'Agency';
    case 'freelancer':
      return 'Freelancer';
    case 'creator':
      return 'Creator';
    case 'specialist':
      return 'Specialist';
    default:
      return 'Expert';
  }
}

function formatAudienceSize(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function FiltersForm({ name, zip, radius, service, problemId, match, minRating, sort, order, limit, verified, compact = false }: FiltersFormProps) {
  return (
    <form method="GET" className={`grid gap-4 ${compact ? '' : 'lg:grid-cols-12'}`}>
      <input type="hidden" name="page" value="1" />
      {problemId ? <input type="hidden" name="problem" value={problemId} /> : null}

      <label className={compact ? '' : 'lg:col-span-3'}>
        <span className="mb-2 block text-sm font-medium text-slate-700">Expert or business name</span>
        <input
          type="text"
          name="name"
          defaultValue={name ?? ''}
          placeholder="Search by expert or business name"
          className={FIELD_CLASS}
        />
      </label>

      <div className={compact ? '' : 'lg:col-span-4'}>
        <NearbyRadiusField
          initialZip={zip}
          initialRadius={radius}
          fieldClassName={FIELD_CLASS}
          zipLabel="ZIP code"
          zipPlaceholder="60559"
          helperText="Search nearby experts by ZIP. The slider appears once the ZIP is ready."
        />
      </div>

      <label className={compact ? '' : 'lg:col-span-3'}>
        <span className="mb-2 block text-sm font-medium text-slate-700">Service</span>
        <input
          type="text"
          name="service"
          defaultValue={service ?? ''}
          placeholder="ads, social, website"
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
          Show verified experts only
        </label>
      </div>

      <div className={compact ? '' : 'lg:col-span-12'}>
        <button type="submit" className={PRIMARY_BUTTON_CLASS}>
          Update results
        </button>
      </div>
    </form>
  );
}

function ProviderCard({ provider }: { provider: Provider }) {
  const p = provider;
  const topServices = (p.services ?? []).slice(0, 3);
  const expertTypeLabel = formatExpertTypeLabel(p.expertType);
  const pricingLabel = p.minProjectBudget
    ? `${p.currencyCode || 'USD'} ${p.minProjectBudget}+ min`
      : p.hourlyRateMin || p.hourlyRateMax
      ? `${p.currencyCode || 'USD'} ${p.hourlyRateMin ?? ''}${p.hourlyRateMax ? `-${p.hourlyRateMax}` : '+'}/hr`
      : 'Request quote';
  const profileSummary = p.shortDescription ? p.shortDescription : p.tagline ? p.tagline : 'Explore services, fit, pricing guidance, and contact details.';
  const creatorPlatformsLabel = p.creatorPlatforms?.length ? p.creatorPlatforms.join(' • ') : null;
  const creatorAudienceLabel = formatAudienceSize(p.creatorAudienceSize);
  const creatorProofBody =
    p.creatorProofSummary ||
    [creatorPlatformsLabel, creatorAudienceLabel ? `${creatorAudienceLabel} audience` : null].filter(Boolean).join(' • ') ||
    null;
  const trustLabel = p.verified ? 'Verified expert' : p.expertType === 'creator' && creatorProofBody ? 'Creator proof available' : 'Profile available';

  return (
    <li data-testid="expert-result-card" className="list-none">
      <details name="expert-card" className="group relative ml-card overflow-visible rounded-[1.55rem] transition open:shadow-[0_18px_42px_rgba(23,26,31,0.08)]">
        <summary data-testid="expert-card-toggle" className="relative block cursor-pointer list-none pb-8 sm:pb-10">
          <div className="flex flex-col sm:grid sm:grid-cols-[176px_minmax(0,1fr)]">
            <div className="ml-surface-muted h-44 overflow-hidden sm:min-h-[210px]">
              {p.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logo} alt={p.businessName} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Logo</div>
              )}
            </div>

            <div className="min-w-0 px-4 pt-4 sm:grid sm:grid-cols-[minmax(0,1fr)_190px] sm:gap-5 sm:px-5 sm:py-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                  <span>{expertTypeLabel}</span>
                  <span aria-hidden="true">/</span>
                  <span>
                    {p.city}, {p.state}
                  </span>
                  {typeof p.distanceMiles === 'number' ? (
                    <>
                      <span aria-hidden="true">/</span>
                      <span className="text-slate-700">{p.distanceMiles} miles away</span>
                    </>
                  ) : null}
                  {p.verified ? (
                    <>
                      <span aria-hidden="true">/</span>
                      <span className="text-slate-700">Verified</span>
                    </>
                  ) : null}
                </div>

                <h3 className="mt-2 truncate text-[1.2rem] font-semibold tracking-tight text-slate-900 sm:text-[1.35rem]">{p.businessName}</h3>

                {topServices.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2" title={p.services.join(', ')}>
                    {topServices.map((service) => (
                      <span key={service} className={`${PILL_CLASS} px-3 text-[10px]`}>
                        {service}
                      </span>
                    ))}
                  </div>
                ) : null}

              </div>

              <div className="mt-4 border-t border-slate-200/75 pt-4 sm:mt-0 sm:border-t-0 sm:pt-0">
                <div className="text-left sm:text-right">
                  <div className="text-lg font-semibold text-slate-900">{pricingLabel}</div>
                  <div className="mt-1 text-sm text-slate-600">{trustLabel}</div>
                </div>
              </div>
            </div>
          </div>

          <span className="pointer-events-none absolute bottom-0 left-1/2 inline-flex h-7 w-14 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-b-[1rem] border border-slate-200 border-t-0 bg-white text-slate-500 shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
            <span className="text-sm leading-none transition-transform duration-200 group-hover:animate-bounce group-open:animate-none group-open:rotate-180" aria-hidden="true">
              &darr;
            </span>
          </span>
        </summary>

        <div data-testid="expert-card-expanded-panel" className="border-t border-slate-200/80 bg-slate-50/45 px-4 pb-4 pt-7 sm:px-5 sm:pb-5 sm:pt-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Why this expert</div>
              <p className="mt-2 text-sm leading-7 text-slate-700">{profileSummary}</p>

              {p.expertType === 'creator' && (creatorProofBody || creatorPlatformsLabel || creatorAudienceLabel) ? (
                <div className="mt-4 rounded-[1.15rem] bg-white/80 px-4 py-4 ring-1 ring-slate-200/80">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Creator proof</div>
                  {creatorPlatformsLabel ? <div className="mt-2 text-sm font-medium text-slate-900">{creatorPlatformsLabel}</div> : null}
                  {creatorAudienceLabel ? <div className="mt-1 text-sm text-slate-600">{creatorAudienceLabel} audience</div> : null}
                  {creatorProofBody ? <p className="mt-2 text-sm leading-6 text-slate-700">{creatorProofBody}</p> : null}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.15rem] bg-white/80 px-4 py-4 ring-1 ring-slate-200/80">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Trust signal</div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{trustLabel}</p>
                </div>
              )}
            </div>

            <div className="grid gap-4">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">What they offer</div>
                {p.services?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.services.map((service) => (
                      <span key={service} className={`${PILL_CLASS} px-3 text-[10px]`}>
                        {service}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-600">Open the full profile to view the complete service list.</p>
                )}
              </div>

              <Link
                href={`/experts/${p.slug}`}
                className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white"
              >
                View full profile
              </Link>
            </div>
          </div>
        </div>
      </details>
    </li>
  );
}

function ProblemContextPanel({ problem }: { problem: DiscoveryProblemCard }) {
  const suggestedPaths = getDiscoveryServicePathsForProblem(problem);

  return (
    <section data-testid="problem-context-panel" className={`${SECTION_CLASS} mt-6`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">Problem context</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            You&apos;re looking for help with: {problem.problemTitle}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {problem.customerLanguage} {problem.outcomePromise}
          </p>
        </div>

        <Link href="/experts" className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold">
          Browse all experts
        </Link>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {suggestedPaths.slice(0, 3).map((path) => (
          <Link
            key={path.id}
            href={getDiscoveryServicePathHrefForProblem(path, problem)}
            data-testid="problem-context-service-link"
            className="group rounded-[1.35rem] bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-900">{path.plainLabel}</h3>
                <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">{path.technicalLabel}</div>
              </div>
              <span className="text-lg text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" aria-hidden="true">
                &rarr;
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{path.shortHelp}</p>
          </Link>
        ))}
      </div>
    </section>
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
  const zip = typeof resolvedSearchParams.zip === 'string' ? resolvedSearchParams.zip : undefined;
  const radius = typeof resolvedSearchParams.radius === 'string' ? resolvedSearchParams.radius : undefined;
  const service = typeof resolvedSearchParams.service === 'string' ? resolvedSearchParams.service : undefined;
  const problemId = typeof resolvedSearchParams.problem === 'string' ? resolvedSearchParams.problem : undefined;
  const problemContext = getDiscoveryProblemById(problemId);
  const match = (typeof resolvedSearchParams.match === 'string' ? resolvedSearchParams.match : 'any') as 'any' | 'all';
  const minRating = typeof resolvedSearchParams.minRating === 'string' ? resolvedSearchParams.minRating : undefined;
  const verified = typeof resolvedSearchParams.verified === 'string' ? resolvedSearchParams.verified : undefined;

  const sort = (typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : 'newest') as 'newest' | 'name' | 'rating' | 'verified';
  const order = (typeof resolvedSearchParams.order === 'string' ? resolvedSearchParams.order : undefined) as 'asc' | 'desc' | undefined;
  const page = Math.max(1, parseInt(String(resolvedSearchParams.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(resolvedSearchParams.limit ?? '20'), 10) || 20));

  const qs = toQS({
    name,
    zip,
    radius,
    service,
    match,
    minRating,
    verified,
    sort,
    order,
    page: String(page),
    limit: String(limit),
  });

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const res = await fetch(`${apiBase}/experts?${qs}`, {
    cache: 'no-store',
    headers: { 'content-type': 'application/json' },
  });

  if (!res.ok) {
    return (
      <main className="ml-page-bg min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="ml-card rounded-[1.8rem] px-6 py-8 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">Experts</h1>
            <p className="mt-3 text-red-600">Failed to load experts.</p>
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
    zip,
    radius,
    service,
    problem: problemContext?.id,
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
    zip ? { label: `ZIP: ${zip}` } : null,
    radius ? { label: `Radius: ${radius} miles` } : null,
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
              <div className="text-[11px] font-medium uppercase tracking-[0.26em] text-slate-500">Expert directory</div>
              <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl">Find local experts by ZIP, distance, service, and fit.</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Search by ZIP and radius, then compare nearby experts by service, trust, pricing guidance, and proof.
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

        {problemContext ? <ProblemContextPanel problem={problemContext} /> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section className={`${SECTION_CLASS} lg:hidden`}>
            <details className="group">
              <summary className="ml-surface flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.4rem] px-4 py-4 shadow-sm">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Filters</div>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Refine results</h2>
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
                  <div className="text-sm font-medium text-slate-700">Set filters and update the results when ready.</div>
                  <Link href="/experts" className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900">
                    Clear filters
                  </Link>
                </div>
                <FiltersForm name={name} zip={zip} radius={radius} service={service} problemId={problemContext?.id} match={match} minRating={minRating} sort={sort} order={order} limit={limit} verified={verified} compact />
              </div>
            </details>
          </section>

          <aside data-testid="desktop-filter-rail" className={`${SECTION_CLASS} hidden lg:sticky lg:top-24 lg:block`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Filters</div>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Refine results</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Adjust the list while keeping experts in view.</p>
              </div>
              <Link href="/experts" className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900">
                Clear
              </Link>
            </div>

            <div className="mt-5">
              <FiltersForm name={name} zip={zip} radius={radius} service={service} problemId={problemContext?.id} match={match} minRating={minRating} sort={sort} order={order} limit={limit} verified={verified} compact />
            </div>
          </aside>

          <section className={`${SECTION_CLASS} lg:order-first`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Expert results</h2>
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
              No experts found. Try adjusting your filters.
            </div>
          ) : (
            <ul data-testid="expert-results-list" className="mt-5 grid grid-cols-1 gap-4">
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
                href={`/experts?${prevParams}`}
              >
                Prev
              </Link>

              {pageWindow.map((item, index) =>
                typeof item === 'number' ? (
                  <Link
                    key={`${item}-${index}`}
                    href={`/experts?${toQS({ ...baseParams, page: String(item) })}`}
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
                href={`/experts?${nextParams}`}
              >
                Next
              </Link>
            </div>
          </div>
          </section>
        </div>
      </div>
    </main>
  );
}


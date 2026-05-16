import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getDiscoveryProblemById,
  getDiscoveryServicePathsForProblem,
  discoveryServicePaths,
} from '@/lib/discovery';
import type { DiscoveryProblemCard } from '@/lib/discovery';
import NearbyRadiusField from '@/components/NearbyRadiusField';
import ExpertsDiscoveryMap from '@/components/ExpertsDiscoveryMap';

export const metadata: Metadata = {
  title: 'Experts | MarketLink',
};

type Provider = {
  id: string;
  slug: string;
  businessName: string;
  expertType?: 'agency' | 'freelancer' | 'creator' | 'specialist' | null;
  locationPrecision?: 'exact' | 'approximate' | null;
  tagline: string | null;
  shortDescription?: string | null;
  city: string;
  state: string;
  zip?: string | null;
  streetAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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
  verified?: string;
};

const FIELD_CLASS = 'ml-input w-full rounded-[1.05rem] px-4 py-3 text-sm';
const CHECKBOX_CLASS = 'ml-checkbox h-4 w-4 rounded';
const PRIMARY_BUTTON_CLASS = 'ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-[1.05rem] px-5 text-sm font-semibold shadow-sm';
const PILL_CLASS = 'ml-pill rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]';
const SECTION_CLASS = 'ml-card rounded-[1.8rem] px-5 py-5 shadow-[0_16px_40px_rgba(23,26,31,0.06)] sm:px-6 sm:py-6';
const SERVICE_FILTER_OPTIONS = discoveryServicePaths.map((path) => ({
  value: path.serviceTokens.join(','),
  label: path.plainLabel,
}));

function ControlIcon({ kind }: { kind: 'map' | 'name' | 'service' | 'filters' | 'location' }) {
  const className = 'h-3.5 w-3.5';

  switch (kind) {
    case 'map':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <path d="M4 7.5 9.5 5l5 2.5L20 5v11.5L14.5 19l-5-2.5L4 19V7.5Z" />
          <path d="M9.5 5v11.5M14.5 7.5V19" />
        </svg>
      );
    case 'name':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <circle cx="12" cy="8.5" r="3.1" />
          <path d="M6.5 18c1.6-2.5 3.5-3.8 5.5-3.8 2 0 3.9 1.3 5.5 3.8" />
        </svg>
      );
    case 'service':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <rect x="4" y="6" width="16" height="12" rx="2.5" />
          <path d="M8 10h8M8 14h5" />
        </svg>
      );
    case 'filters':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <path d="M4 7h16M7 12h10M10 17h4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <path d="M12 21s6-4.8 6-10a6 6 0 1 0-12 0c0 5.2 6 10 6 10Z" />
          <circle cx="12" cy="11" r="2.3" />
        </svg>
      );
  }
}

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

function formatMoney(value: number | null | undefined, currencyCode: string | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currencyCode || 'USD'} ${value}`;
  }
}

function formatMoneyRange(min: number | null | undefined, max: number | null | undefined, currencyCode: string | null | undefined) {
  const formattedMin = formatMoney(min, currencyCode);
  const formattedMax = formatMoney(max, currencyCode);

  if (formattedMin && formattedMax) return `${formattedMin} - ${formattedMax} / hr`;
  if (formattedMin) return `${formattedMin}+ / hr`;
  if (formattedMax) return `Up to ${formattedMax} / hr`;
  return null;
}

function getServiceFilterLabel(service: string | undefined) {
  if (!service) return null;
  const normalized = service
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
    .join(',');

  return SERVICE_FILTER_OPTIONS.find((option) => option.value === normalized)?.label ?? service;
}

function getExpertTypeChrome(expertType: Provider['expertType']) {
  switch (expertType) {
    case 'agency':
      return {
        panel: 'from-[#fdebdc] via-[#fff7f0] to-[#f3f7fd]',
        badge: 'bg-[#1f314d] text-white',
      };
    case 'creator':
      return {
        panel: 'from-[#fbe7f0] via-[#fff8fb] to-[#eef6ff]',
        badge: 'bg-[#e38360] text-white',
      };
    case 'freelancer':
      return {
        panel: 'from-[#dff1ff] via-[#f8fcff] to-[#fef6ef]',
        badge: 'bg-[#406a9c] text-white',
      };
    default:
      return {
        panel: 'from-[#eef2f8] via-[#fbfcff] to-[#f7efe8]',
        badge: 'bg-slate-800 text-white',
      };
  }
}

function formatLocation(provider: Provider) {
  return [provider.city, provider.state, provider.zip].filter(Boolean).join(', ');
}

function buildPricingLabel(provider: Provider) {
  if (provider.minProjectBudget) {
    return `Starting at ${formatMoney(provider.minProjectBudget, provider.currencyCode)}`;
  }

  const hourlyRange = formatMoneyRange(provider.hourlyRateMin, provider.hourlyRateMax, provider.currencyCode);
  return hourlyRange || 'Ask for pricing';
}

function FiltersForm({ name, zip, radius, service, problemId, verified }: FiltersFormProps) {
  const verifiedChecked = verified === '1' || (verified ?? '').toLowerCase() === 'true';

  return (
    <form method="GET" className="grid gap-3">
      <input type="hidden" name="page" value="1" />
      {problemId ? <input type="hidden" name="problem" value={problemId} /> : null}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px_auto] xl:items-end">
        <NearbyRadiusField
          initialZip={zip}
          initialRadius={radius}
          compact
          hideCompactStatus
          fieldClassName={`${FIELD_CLASS} bg-white`}
          zipLabel="Location ZIP"
          zipPlaceholder="60559"
        />

        <label className="grid gap-2">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <ControlIcon kind="service" />
            <span>Service</span>
          </span>
          <select
            name="service"
            defaultValue={service ?? ''}
            className={`${FIELD_CLASS} bg-white`}
          >
            <option value="">All services</option>
            {SERVICE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className={`${PRIMARY_BUTTON_CLASS} gap-2`}>
          <ControlIcon kind="filters" />
          <span>Filter</span>
        </button>
      </div>

      <details className="rounded-[1.15rem] border border-slate-200/90 bg-white px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <ControlIcon kind="filters" />
            <span>More filters</span>
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Name and verified</span>
        </summary>
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px_auto] md:items-end">
          <label className="grid gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <ControlIcon kind="name" />
              <span>Business name</span>
            </span>
            <input
              type="text"
              name="name"
              defaultValue={name ?? ''}
              placeholder="Search by business name"
              className={`${FIELD_CLASS} bg-white`}
            />
          </label>

          <div className="grid gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <ControlIcon kind="filters" />
              <span>Verification</span>
            </span>
            <label className="ml-input flex w-full items-center gap-3 rounded-[1.05rem] bg-white px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="verified"
                value="1"
                defaultChecked={verifiedChecked}
                className={CHECKBOX_CLASS}
              />
              Verified only
            </label>
          </div>

          <Link href="/experts" className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900">
            Clear filters
          </Link>
        </div>
      </details>
    </form>
  );
}

function ProviderCard({ provider }: { provider: Provider }) {
  const chrome = getExpertTypeChrome(provider.expertType);
  const expertTypeLabel = formatExpertTypeLabel(provider.expertType);
  const topServices = provider.services.slice(0, 3);
  const creatorAudienceLabel = formatAudienceSize(provider.creatorAudienceSize);
  const creatorProofBody =
    provider.creatorProofSummary ||
    [provider.creatorPlatforms?.join(', ') || null, creatorAudienceLabel ? `${creatorAudienceLabel} audience` : null]
      .filter(Boolean)
      .join(' | ') ||
    null;
  const locationLabel = formatLocation(provider);
  const pricingLabel = buildPricingLabel(provider);
  const shortSummary =
    provider.shortDescription ||
    provider.tagline ||
    (provider.expertType === 'creator' && creatorProofBody
      ? creatorProofBody
      : 'Open the profile to review fit, proof of work, and contact details.');
  const hasRealLogo = Boolean(provider.logo && !provider.logo.includes('placehold.co'));

  return (
    <li data-testid="expert-result-card" data-provider-id={provider.id} className="list-none">
      <Link href={`/experts/${provider.slug}`} className="group block">
        <article className="ml-card overflow-hidden rounded-[1.55rem] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(18,26,42,0.1)]">
          <div className="flex flex-col sm:grid sm:grid-cols-[124px_minmax(0,1fr)_200px]">
            <div className={`overflow-hidden bg-gradient-to-br ${chrome.panel} p-4 sm:min-h-[200px]`}>
              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-sm ${chrome.badge}`}>
                {expertTypeLabel}
              </span>

              <div className="mt-6 grid place-items-center">
                {hasRealLogo ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={provider.logo ?? ''} alt={provider.businessName} className="h-18 w-18 rounded-[1.05rem] border border-white/80 bg-white object-cover shadow-sm sm:h-20 sm:w-20" />
                    <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Local expert</div>
                  </>
                ) : (
                  <>
                    <div className={`grid h-18 w-18 place-items-center rounded-[1.05rem] border border-white/80 bg-white text-lg font-semibold shadow-sm sm:h-20 sm:w-20 ${chrome.badge}`}>
                      {provider.businessName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Local expert</div>
                  </>
                )}
              </div>
            </div>

            <div className="min-w-0 px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                <span>{locationLabel}</span>
                {typeof provider.distanceMiles === 'number' ? (
                  <>
                    <span aria-hidden="true">/</span>
                    <span className="text-slate-700">{provider.distanceMiles} miles away</span>
                  </>
                ) : null}
                {provider.verified ? (
                  <>
                    <span aria-hidden="true">/</span>
                    <span className="text-slate-700">Verified</span>
                  </>
                ) : null}
              </div>

              <h3 className="mt-2 text-[1.25rem] font-semibold tracking-tight text-slate-900 transition group-hover:text-slate-700 sm:text-[1.45rem]">
                {provider.businessName}
              </h3>

              {topServices.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2" title={provider.services.join(', ')}>
                  {topServices.map((service) => (
                    <span key={service} className={`${PILL_CLASS} px-3 text-[10px]`}>
                      {service}
                    </span>
                  ))}
                </div>
              ) : null}

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{shortSummary}</p>
            </div>

            <div className="border-t border-slate-200/75 px-4 py-4 sm:border-l sm:border-t-0 sm:px-5 sm:py-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Starting price</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">{pricingLabel}</div>
              <div className="mt-2 text-sm text-slate-600">
                {provider.expertType === 'creator' && provider.locationPrecision === 'approximate'
                  ? 'Approximate area shown'
                  : provider.zip
                  ? `ZIP ${provider.zip}`
                  : provider.verified
                  ? 'Verified expert'
                  : 'Profile available'}
              </div>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                Open profile
                <span className="transition group-hover:translate-x-1" aria-hidden="true">
                  &rarr;
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </li>
  );
}

function ProblemContextPanel({ problem }: { problem: DiscoveryProblemCard }) {
  const suggestedPaths = getDiscoveryServicePathsForProblem(problem)
    .slice(0, 3)
    .map((path) => path.plainLabel);

  return (
    <section data-testid="problem-context-panel" className="rounded-[1.45rem] border border-slate-200/80 bg-[#f9f6f1] px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">How to choose here</div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
            Looking for help with: {problem.problemTitle}
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Start with service fit, then open the profile that has the strongest proof and location match.
          </p>
          {suggestedPaths.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestedPaths.map((label) => (
                <span key={label} className={`${PILL_CLASS} rounded-full px-3 py-1.5`}>
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <Link href="#directory-map" className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">
          Jump to map
        </Link>
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
  const verified = typeof resolvedSearchParams.verified === 'string' ? resolvedSearchParams.verified : undefined;
  const page = Math.max(1, parseInt(String(resolvedSearchParams.page ?? '1'), 10) || 1);

  const qs = toQS({
    name,
    zip,
    radius,
    service,
    verified,
    page: String(page),
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
  const { totalPages } = meta;

  const baseParams = {
    name,
    zip,
    radius,
    service,
    problem: problemContext?.id,
    verified,
  };

  const prevParams = toQS({ ...baseParams, page: String(Math.max(1, page - 1)) });
  const nextParams = toQS({ ...baseParams, page: String(Math.min(totalPages, page + 1)) });
  const pageWindow = buildPageWindow(page, totalPages, 5);

  const activeFilters = [
    zip ? { label: `ZIP: ${zip}` } : null,
    radius ? { label: `Radius: ${radius} miles` } : null,
    service ? { label: `Service: ${getServiceFilterLabel(service)}` } : null,
    name ? { label: `Name: ${name}` } : null,
    verified === '1' || (verified ?? '').toLowerCase() === 'true' ? { label: 'Verified only' } : null,
  ].filter(Boolean) as { label: string }[];

  return (
    <main className="ml-page-bg min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-start">
          <section id="directory-results" className={`${SECTION_CLASS} ml-ambient-shell relative overflow-hidden`}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top_left,rgba(245,197,92,0.18),transparent_32%),radial-gradient(circle_at_68%_22%,rgba(64,106,156,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.55),transparent)]"
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 260 180"
              className="pointer-events-none absolute -right-8 bottom-10 hidden h-48 w-72 opacity-30 lg:block"
            >
              <path d="M18 132c26-18 48-26 70-26 36 0 58 26 88 26 16 0 36-6 64-26" fill="none" stroke="#90b2d4" strokeWidth="7" strokeLinecap="round" />
              <path d="M36 96c18-12 36-18 54-18 28 0 44 18 67 18 12 0 27-4 49-18" fill="none" stroke="#f0c58e" strokeWidth="7" strokeLinecap="round" />
              {[
                [54, 88],
                [132, 118],
                [210, 92],
              ].map(([x, y]) => (
                <g key={`${x}-${y}`}>
                  <circle cx={x} cy={y} r="11" fill="#1f314d" />
                  <circle cx={x} cy={y} r="4" fill="#fff" />
                  <path d={`M${x} ${y + 10}l6 8h-12z`} fill="#1f314d" />
                </g>
              ))}
            </svg>

            <div className="relative flex flex-col gap-4 border-b border-slate-200/80 pb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Expert directory</div>
                  <h1 className="font-display mt-2 text-[1.95rem] leading-[0.96] text-slate-950 sm:text-[2.35rem]">
                    Browse local experts and open the one worth contacting.
                  </h1>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="ml-icon-chip px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                      <ControlIcon kind="location" />
                      Showing {(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                    </span>
                    {problemContext ? (
                      <span className="ml-icon-chip px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                        <ControlIcon kind="service" />
                        {problemContext.problemTitle}
                      </span>
                    ) : null}
                  </div>
                </div>

                <Link href="#directory-map" className="ml-icon-chip shrink-0 whitespace-nowrap px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-950">
                  <ControlIcon kind="map" />
                  <span>Map view</span>
                </Link>
              </div>

              <div className="ml-filter-shell rounded-[1.45rem] p-4">
                <FiltersForm name={name} zip={zip} radius={radius} service={service} problemId={problemContext?.id} verified={verified} />
              </div>

              {activeFilters.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((item) => (
                    <span key={item.label} className={`${PILL_CLASS} rounded-full px-3 py-1.5`}>
                      {item.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div id="directory-map" className="mt-5 lg:hidden">
              <ExpertsDiscoveryMap providers={data} showDesktop={false} />
            </div>

            {problemContext ? <div className="mt-5"><ProblemContextPanel problem={problemContext} /></div> : null}

            {data.length === 0 ? (
              <div className="ml-card mt-5 rounded-[1.5rem] p-8 text-center text-slate-600 shadow-[0_16px_40px_rgba(23,26,31,0.06)]">
                No experts found. Try adjusting your location or service.
              </div>
            ) : (
              <ul data-testid="expert-results-list" className="mt-5 grid grid-cols-1 gap-4">
                {data.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
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

          <ExpertsDiscoveryMap providers={data} showMobile={false} />
        </div>
      </div>
    </main>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatServiceTokenLabel, getMarketingSubjectById } from '@/lib/marketingTaxonomy';
import { getServerApiHeaders } from '@/lib/serverApi';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type SummaryResponse = {
  user?: { email?: string; role?: 'provider' | 'customer' | 'admin' };
  customer?: { name?: string | null; businessName?: string | null } | null;
};

type RequestHistoryItem = {
  id: string;
  title: string;
  intakeMode: 'SPECIFIC' | 'UNSURE';
  marketingSubjectId?: string | null;
  subcategoryId?: string | null;
  serviceTokens: string[];
  zip?: string | null;
  radiusMiles?: number | null;
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  proposalSummary: {
    total: number;
    pending: number;
    accepted: number;
    declined: number;
  };
};

type RequestsResponse = {
  ok?: boolean;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data?: RequestHistoryItem[];
};

type CustomerRequestsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatRequestStatus(status: RequestHistoryItem['status']) {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'CLOSED') return 'Closed';
  return 'Cancelled';
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function normalizePage(input: string | string[] | undefined) {
  const value = Array.isArray(input) ? input[0] : input;
  const parsed = Number.parseInt(String(value || '1'), 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, parsed);
}

function getRequestAreaLabel(request: RequestHistoryItem) {
  const subject = request.marketingSubjectId ? getMarketingSubjectById(request.marketingSubjectId) : null;
  const subcategory = request.subcategoryId ? subject?.subcategories.find((item) => item.id === request.subcategoryId) ?? null : null;

  if (subcategory) return subcategory.label;
  if (subject) return subject.label;
  if (request.intakeMode === 'UNSURE') return 'Not sure yet';
  return 'General request';
}

function getRequestLocationLabel(request: RequestHistoryItem) {
  if (request.zip && request.radiusMiles) return `ZIP ${request.zip} • ${request.radiusMiles} miles`;
  if (request.zip) return `ZIP ${request.zip}`;
  if (request.intakeMode === 'UNSURE') return 'Open local request';
  return 'Specific request';
}

export default async function CustomerRequestsPage({ searchParams }: CustomerRequestsPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = normalizePage(resolvedSearchParams.page);
  const requestHeaders = await getServerApiHeaders();

  const summaryRes = await fetch(`${API_BASE}/me/summary`, {
    headers: requestHeaders,
    cache: 'no-store',
  });

  if (summaryRes.status === 401) {
    redirect('/login?returnTo=/dashboard/customer/requests');
  }

  if (!summaryRes.ok) {
    throw new Error(`Failed to load customer account (${summaryRes.status})`);
  }

  const summary = (await summaryRes.json()) as SummaryResponse;

  if (summary.user?.role === 'admin') redirect('/dashboard/admin');
  if (summary.user?.role === 'provider') redirect('/dashboard');
  if (!(summary.customer?.name || '').trim()) redirect('/dashboard/customer/onboarding');

  const requestsRes = await fetch(`${API_BASE}/requests?page=${page}`, {
    headers: requestHeaders,
    cache: 'no-store',
  });

  if (!requestsRes.ok) {
    throw new Error(`Failed to load customer requests (${requestsRes.status})`);
  }

  const requestsData = (await requestsRes.json()) as RequestsResponse;
  const requests = requestsData.data || [];
  const meta = requestsData.meta || {
    total: requests.length,
    page,
    limit: 10,
    totalPages: Math.max(1, requests.length > 0 ? 1 : 0),
  };
  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);
  const prevPageHref = `/dashboard/customer/requests?page=${Math.max(1, meta.page - 1)}`;
  const nextPageHref = `/dashboard/customer/requests?page=${Math.min(meta.totalPages, meta.page + 1)}`;

  return (
    <main className="ml-page-bg min-h-[calc(100vh-72px)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Customer requests</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Request history</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Create requests privately, then revisit the matching preview and request details here. Active requests can keep matching, while closed and cancelled requests stay visible in your history.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard/customer" className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900">
              Back to dashboard
            </Link>
            <Link href="/dashboard/customer/requests/new" className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white">
              Create request
            </Link>
          </div>
        </div>

        {requests.length === 0 ? (
          <section className="ml-card mt-5 rounded-[28px] p-6 shadow-[0_18px_50px_rgba(23,26,31,0.06)]">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">No requests yet</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Start with your first request</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Once you describe what you need, MarketLink will show a private matching preview based on service tags and the MVP locality rules.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/customer/requests/new" className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white">
                Create request
              </Link>
              <Link href="/experts" className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900">
                Browse experts
              </Link>
            </div>
          </section>
        ) : (
          <section className="mt-5 grid gap-4">
            <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,246,248,0.94))] px-5 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                Showing {start}-{end} of {meta.total}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  aria-disabled={meta.page <= 1}
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    meta.page <= 1
                      ? 'pointer-events-none border-slate-200/80 bg-slate-100 text-slate-400'
                      : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  href={prevPageHref}
                >
                  Prev
                </Link>

                <span className="text-sm text-slate-600">
                  Page {meta.page} / {meta.totalPages}
                </span>

                <Link
                  aria-disabled={meta.page >= meta.totalPages}
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    meta.page >= meta.totalPages
                      ? 'pointer-events-none border-slate-200/80 bg-slate-100 text-slate-400'
                      : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  href={nextPageHref}
                >
                  Next
                </Link>
              </div>
            </div>

            {requests.map((request) => (
              <Link
                key={request.id}
                href={`/dashboard/customer/requests/view?id=${encodeURIComponent(request.id)}`}
                className="ml-card rounded-[24px] p-5 shadow-[0_18px_44px_rgba(23,26,31,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(23,26,31,0.08)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                        {formatRequestStatus(request.status)}
                      </span>
                      <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                        {getRequestAreaLabel(request)}
                      </span>
                      {request.proposalSummary.pending > 0 ? (
                        <span className="inline-flex rounded-xl bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 ring-1 ring-amber-200">
                          {request.proposalSummary.pending} needs decision
                        </span>
                      ) : request.proposalSummary.accepted > 0 ? (
                        <span className="inline-flex rounded-xl bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-200">
                          Proposal accepted
                        </span>
                      ) : request.proposalSummary.total > 0 ? (
                        <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                          {request.proposalSummary.total} proposal{request.proposalSummary.total === 1 ? '' : 's'}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{request.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Created {formatShortDate(request.createdAt)} • {getRequestLocationLabel(request)}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-slate-900">
                    {request.proposalSummary.pending > 0 ? 'Review proposals' : 'Open'}
                  </span>
                </div>

                {request.serviceTokens.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {request.serviceTokens.slice(0, 4).map((token) => (
                      <span
                        key={token}
                        className="inline-flex rounded-xl bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                      >
                        {formatServiceTokenLabel(token)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-slate-500">This request started broad, without a specific marketing category yet.</p>
                )}
              </Link>
            ))}

            <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,246,248,0.94))] px-5 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                Showing {start}-{end} of {meta.total}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  aria-disabled={meta.page <= 1}
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    meta.page <= 1
                      ? 'pointer-events-none border-slate-200/80 bg-slate-100 text-slate-400'
                      : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  href={prevPageHref}
                >
                  Prev
                </Link>

                <span className="text-sm text-slate-600">
                  Page {meta.page} / {meta.totalPages}
                </span>

                <Link
                  aria-disabled={meta.page >= meta.totalPages}
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    meta.page >= meta.totalPages
                      ? 'pointer-events-none border-slate-200/80 bg-slate-100 text-slate-400'
                      : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  href={nextPageHref}
                >
                  Next
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

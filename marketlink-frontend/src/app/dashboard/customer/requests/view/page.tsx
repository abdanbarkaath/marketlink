import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { formatServiceTokenLabel, getMarketingSubjectById } from '@/lib/marketingTaxonomy';
import RequestLifecycleActions from '../RequestLifecycleActions';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type SummaryResponse = {
  user?: { email?: string; role?: 'provider' | 'customer' | 'admin' };
  customer?: { name?: string | null; businessName?: string | null } | null;
};

type DeliveryPreview = {
  matchingModel: string;
  requestLocation?: { zip?: string | null; city?: string | null; state?: string | null; source?: string | null } | null;
  notes?: string[];
  totalMatches: number;
  matchedExperts: Array<{
    id: string;
    slug: string;
    businessName: string;
    city: string;
    state: string;
    zip?: string | null;
    verified: boolean;
    rating: number;
    remoteFriendly: boolean;
    servesNationwide: boolean;
    matchedServiceTokens: string[];
    primaryReason: 'same_zip' | 'same_city' | 'serves_nationwide' | 'remote_friendly';
    reasons: Array<'same_zip' | 'same_city' | 'serves_nationwide' | 'remote_friendly'>;
  }>;
};

type RequestDetailResponse = {
  ok?: boolean;
  request?: {
    id: string;
    requesterName: string;
    requesterBusinessName?: string | null;
    title: string;
    description: string;
    marketingSubjectId: string;
    serviceTokens: string[];
    zip: string;
    budgetLabel?: string | null;
    timelineLabel?: string | null;
    status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
    createdAt: string;
    updatedAt: string;
  };
  deliveryPreview?: DeliveryPreview;
};

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatReason(reason: DeliveryPreview['matchedExperts'][number]['primaryReason']) {
  switch (reason) {
    case 'same_zip':
      return 'Same ZIP';
    case 'same_city':
      return 'Same city';
    case 'serves_nationwide':
      return 'Serves nationwide';
    default:
      return 'Remote-friendly';
  }
}

function formatStatus(status: NonNullable<RequestDetailResponse['request']>['status']) {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'CLOSED') return 'Closed';
  return 'Cancelled';
}

export default async function CustomerRequestDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id = '' } = await searchParams;
  if (!id.trim()) {
    redirect('/dashboard/customer/requests');
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  const cookieHeader = sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : '';

  const summaryRes = await fetch(`${API_BASE}/me/summary`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: 'no-store',
  });

  if (summaryRes.status === 401) {
    redirect(`/login?returnTo=/dashboard/customer/requests/view?id=${encodeURIComponent(id)}`);
  }

  if (!summaryRes.ok) {
    throw new Error(`Failed to load customer account (${summaryRes.status})`);
  }

  const summary = (await summaryRes.json()) as SummaryResponse;

  if (summary.user?.role === 'admin') redirect('/dashboard/admin');
  if (summary.user?.role === 'provider') redirect('/dashboard');
  if (!(summary.customer?.name || '').trim()) redirect('/dashboard/customer/onboarding');

  const requestRes = await fetch(`${API_BASE}/requests/${id}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: 'no-store',
  });

  if (requestRes.status === 404) {
    redirect('/dashboard/customer/requests');
  }

  if (!requestRes.ok) {
    throw new Error(`Failed to load customer request (${requestRes.status})`);
  }

  const data = (await requestRes.json()) as RequestDetailResponse;
  const request = data.request;

  if (!request) {
    throw new Error('Customer request payload was missing.');
  }

  const subject = getMarketingSubjectById(request.marketingSubjectId);
  const preview = data.deliveryPreview;

  return (
    <main className="ml-page-bg min-h-[calc(100vh-72px)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Customer requests</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{request.title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Created {formatShortDate(request.createdAt)} • {formatStatus(request.status)} • ZIP {request.zip}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard/customer/requests" className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900">
              Back to history
            </Link>
            <Link href="/dashboard/customer/requests/new" className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white">
              New request
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_340px]">
          <section className="ml-card rounded-[28px] p-6 shadow-[0_18px_50px_rgba(23,26,31,0.06)]">
            <div className="flex flex-wrap gap-2">
              <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                {formatStatus(request.status)}
              </span>
              <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                {subject?.label || request.marketingSubjectId}
              </span>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Description</div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{request.description}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Business location</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">ZIP {request.zip}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Budget</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{request.budgetLabel || 'Not specified'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Timeline</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{request.timelineLabel || 'Not specified'}</div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Matching tags</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {request.serviceTokens.map((token) => (
                  <span
                    key={token}
                    className="inline-flex rounded-xl bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                  >
                    {formatServiceTokenLabel(token)}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <aside className="ml-card rounded-[28px] p-6 shadow-[0_18px_50px_rgba(23,26,31,0.06)]">
            <div className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Matching preview</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {preview?.totalMatches ?? 0} plausible match{preview?.totalMatches === 1 ? '' : 'es'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This preview is private and based on the current MVP model: service tags plus ZIP, city, nationwide coverage, or remote-friendly service area.
            </p>

            {preview?.requestLocation ? (
              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Request location</div>
                <div className="mt-2 text-sm font-medium text-slate-900">
                  {[preview.requestLocation.city, preview.requestLocation.state].filter(Boolean).join(', ') || `ZIP ${request.zip}`}
                </div>
              </div>
            ) : null}

            {preview?.notes?.length ? (
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                {preview.notes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            ) : null}

            <RequestLifecycleActions requestId={request.id} status={request.status} />
          </aside>
        </div>

        <section className="mt-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Likely experts</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Who this request may reach</h2>
            </div>
          </div>

          {preview?.matchedExperts?.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {preview.matchedExperts.map((expert) => (
                <Link
                  key={expert.id}
                  href={`/experts/${expert.slug}`}
                  className="ml-card rounded-[24px] p-5 shadow-[0_18px_44px_rgba(23,26,31,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(23,26,31,0.08)]"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                      {formatReason(expert.primaryReason)}
                    </span>
                    {expert.verified ? (
                      <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                        Verified
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{expert.businessName}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {expert.city}, {expert.state}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {expert.matchedServiceTokens.map((token) => (
                      <span
                        key={token}
                        className="inline-flex rounded-xl bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                      >
                        {formatServiceTokenLabel(token)}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="ml-card mt-4 rounded-[24px] p-5 shadow-[0_18px_44px_rgba(23,26,31,0.05)]">
              <p className="text-sm leading-6 text-slate-600">
                No plausible matches showed up yet. Try broadening the marketing area, adjusting the ZIP, or browsing experts directly.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

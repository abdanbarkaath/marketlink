import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { formatServiceTokenLabel, getMarketingSubjectById } from '@/lib/marketingTaxonomy';
import ProposalDecisionActions from '../../proposals/ProposalDecisionActions';
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

type RequestDetail = {
  id: string;
  requesterName: string;
  requesterBusinessName?: string | null;
  title: string;
  description: string;
  intakeMode: 'SPECIFIC' | 'UNSURE';
  marketingSubjectId?: string | null;
  subcategoryId?: string | null;
  serviceTokens: string[];
  zip?: string | null;
  radiusMiles?: number | null;
  budgetLabel?: string | null;
  timelineLabel?: string | null;
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
};

type RequestDetailResponse = {
  ok?: boolean;
  request?: RequestDetail;
  deliveryPreview?: DeliveryPreview | null;
  proposals?: Array<{
    id: string;
    requestId: string;
    expertId: string;
    message: string;
    priceLabel?: string | null;
    timelineLabel?: string | null;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';
    createdAt: string;
    updatedAt: string;
    expert: {
      id: string;
      slug: string;
      businessName: string;
      expertType?: string | null;
      city: string;
      state: string;
      verified: boolean;
      rating: number;
    };
  }>;
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

function formatStatus(status: RequestDetail['status']) {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'CLOSED') return 'Closed';
  return 'Cancelled';
}

function formatProposalStatus(status: NonNullable<RequestDetailResponse['proposals']>[number]['status']) {
  if (status === 'PENDING') return 'New proposal';
  if (status === 'ACCEPTED') return 'Accepted';
  if (status === 'DECLINED') return 'Declined';
  return 'Withdrawn';
}

function formatExpertType(value?: string | null) {
  const cleanValue = (value || 'expert').trim();

  return cleanValue
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function getRequestAreaDetails(request: RequestDetail) {
  const subject = request.marketingSubjectId ? getMarketingSubjectById(request.marketingSubjectId) : null;
  const subcategory = request.subcategoryId ? subject?.subcategories.find((item) => item.id === request.subcategoryId) ?? null : null;

  return {
    subject,
    subcategory,
    label: subcategory?.label || subject?.label || (request.intakeMode === 'UNSURE' ? 'Not sure yet' : 'General request'),
  };
}

function getLocationSummary(request: RequestDetail) {
  if (request.zip && request.radiusMiles) return `ZIP ${request.zip} • ${request.radiusMiles} mile radius`;
  if (request.zip) return `ZIP ${request.zip}`;
  if (request.intakeMode === 'UNSURE') return 'Open local request';
  return 'Specific request';
}

function getPreviewEmptyMessage(request: RequestDetail) {
  if (request.intakeMode === 'UNSURE') {
    return 'This request started broad. The location is saved, and the next matching step can use it without locking the request into one category.';
  }

  return 'No matching preview is available for this request yet. Providers can still respond privately through the normal request flow.';
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

  const areaDetails = getRequestAreaDetails(request);
  const preview = data.deliveryPreview;
  const proposals = data.proposals || [];
  const pendingProposalCount = proposals.filter((proposal) => proposal.status === 'PENDING').length;

  return (
    <main className="ml-page-bg min-h-[calc(100vh-72px)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Customer requests</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{request.title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Created {formatShortDate(request.createdAt)} • {formatStatus(request.status)} • {getLocationSummary(request)}
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
                {areaDetails.label}
              </span>
              <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                {request.intakeMode === 'UNSURE' ? 'Unsure path' : 'Specific path'}
              </span>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Description</div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{request.description}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Request path</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{request.intakeMode === 'UNSURE' ? 'Not sure yet' : 'Specific marketing area selected'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Business location</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{getLocationSummary(request)}</div>
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
              {request.serviceTokens.length ? (
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
              ) : (
                <p className="mt-2 text-sm leading-6 text-slate-500">This request was kept broad, so there are no category tags attached yet.</p>
              )}
            </div>
          </section>

          <aside className="ml-card rounded-[28px] p-6 shadow-[0_18px_50px_rgba(23,26,31,0.06)]">
            <div className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Matching preview</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {preview ? `${preview.totalMatches} plausible match${preview.totalMatches === 1 ? '' : 'es'}` : 'Preview not available yet'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {preview
                ? 'This preview is private and based on the current MVP model: service tags plus ZIP, city, nationwide coverage, or remote-friendly service area.'
                : getPreviewEmptyMessage(request)}
            </p>

            {preview?.requestLocation ? (
              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Request location</div>
                <div className="mt-2 text-sm font-medium text-slate-900">
                  {[preview.requestLocation.city, preview.requestLocation.state].filter(Boolean).join(', ') || getLocationSummary(request)}
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Provider proposals</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {proposals.length
                  ? pendingProposalCount
                    ? `${pendingProposalCount} proposal${pendingProposalCount === 1 ? '' : 's'} needs your decision`
                    : `${proposals.length} proposal${proposals.length === 1 ? '' : 's'} received`
                  : 'No proposals yet'}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Review who responded, their note, estimated budget, and timing. Accept the proposal you want to move forward with, or decline ones that are not a fit.
              </p>
            </div>
            <Link href="/dashboard/customer/proposals" className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900">
              Proposal inbox
            </Link>
          </div>

          {proposals.length ? (
            <div className="mt-4 grid gap-4">
              {proposals.map((proposal) => (
                <article key={proposal.id} className="ml-card rounded-[28px] p-5 shadow-[0_18px_44px_rgba(23,26,31,0.05)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                          {formatProposalStatus(proposal.status)}
                        </span>
                        {proposal.expert.verified ? (
                          <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                            Verified
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{proposal.expert.businessName}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {formatExpertType(proposal.expert.expertType)} in {proposal.expert.city}, {proposal.expert.state}
                      </p>
                    </div>

                    <Link
                      href={`/experts/${proposal.expert.slug}`}
                      className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900"
                    >
                      View expert profile
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Provider note</div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{proposal.message}</p>
                    </div>

                    <div className="grid gap-4">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Estimate</div>
                        <dl className="mt-3 space-y-3 text-sm">
                          <div>
                            <dt className="text-slate-500">Budget</dt>
                            <dd className="mt-1 font-semibold text-slate-950">{proposal.priceLabel || 'Not specified'}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Timing</dt>
                            <dd className="mt-1 font-semibold text-slate-950">{proposal.timelineLabel || 'Not specified'}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Received</dt>
                            <dd className="mt-1 font-semibold text-slate-950">{formatShortDate(proposal.createdAt)}</dd>
                          </div>
                        </dl>
                      </div>

                      {proposal.status === 'ACCEPTED' ? (
                        <Link
                          href={`/dashboard/customer/messages?proposalId=${encodeURIComponent(proposal.id)}`}
                          className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white"
                        >
                          Open private chat
                        </Link>
                      ) : null}

                      <ProposalDecisionActions proposalId={proposal.id} status={proposal.status} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="ml-card mt-4 rounded-[24px] p-5 shadow-[0_18px_44px_rgba(23,26,31,0.05)]">
              <p className="text-sm leading-6 text-slate-600">
                Providers have not sent proposals yet. This page will update once matched experts respond to the request.
              </p>
            </div>
          )}
        </section>

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
              <p className="text-sm leading-6 text-slate-600">{getPreviewEmptyMessage(request)}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMarketingSubjectById } from '@/lib/marketingTaxonomy';
import { getServerApiHeaders } from '@/lib/serverApi';
import ProposalDecisionActions from './ProposalDecisionActions';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type SummaryResponse = {
  user?: { email?: string; role?: 'provider' | 'customer' | 'admin' };
  customer?: { name?: string | null; businessName?: string | null } | null;
};

type ProposalInboxItem = {
  id: string;
  requestId: string;
  expertId: string;
  message: string;
  priceLabel?: string | null;
  timelineLabel?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';
  createdAt: string;
  updatedAt: string;
  request: {
    id: string;
    title: string;
    marketingSubjectId?: string | null;
    status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  };
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
};

type ProposalInboxResponse = {
  ok?: boolean;
  data?: ProposalInboxItem[];
};

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatProposalStatus(status: ProposalInboxItem['status']) {
  if (status === 'PENDING') return 'Needs decision';
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

export default async function CustomerProposalsPage() {
  const requestHeaders = await getServerApiHeaders();

  const summaryRes = await fetch(`${API_BASE}/me/summary`, {
    headers: requestHeaders,
    cache: 'no-store',
  });

  if (summaryRes.status === 401) {
    redirect('/login?returnTo=/dashboard/customer/proposals');
  }

  if (!summaryRes.ok) {
    throw new Error(`Failed to load customer account (${summaryRes.status})`);
  }

  const summary = (await summaryRes.json()) as SummaryResponse;

  if (summary.user?.role === 'admin') redirect('/dashboard/admin');
  if (summary.user?.role === 'provider') redirect('/dashboard');
  if (!(summary.customer?.name || '').trim()) redirect('/dashboard/customer/onboarding');

  const proposalsRes = await fetch(`${API_BASE}/proposals`, {
    headers: requestHeaders,
    cache: 'no-store',
  });

  if (!proposalsRes.ok) {
    throw new Error(`Failed to load customer proposals (${proposalsRes.status})`);
  }

  const proposalsData = (await proposalsRes.json()) as ProposalInboxResponse;
  const proposals = proposalsData.data || [];
  const pendingCount = proposals.filter((proposal) => proposal.status === 'PENDING').length;

  return (
    <main className="ml-page-bg min-h-[calc(100vh-72px)]">
      <div className="dashboard-page-content mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="dashboard-intro flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Proposal inbox</h1>
            <p className="dashboard-intro-copy mt-3 max-w-2xl text-sm leading-6">
              Compare incoming proposals across your requests. Accept the provider you want to move forward with or decline proposals that are not a fit.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/dashboard/customer/requests" className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white">
              Request history
            </Link>
          </div>
        </div>

        <dl className="ml-card mt-5 flex flex-wrap gap-x-8 gap-y-2 rounded-xl px-5 py-4 text-sm">
          <div className="flex items-baseline gap-2">
            <dt className="text-slate-600">Total proposals</dt>
            <dd className="font-bold tabular-nums text-slate-950">{proposals.length}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-slate-600">Needs decision</dt>
            <dd className="font-bold tabular-nums text-slate-950">{pendingCount}</dd>
          </div>
        </dl>

        {proposals.length ? (
          <section className="mt-5 grid gap-4">
            {proposals.map((proposal) => {
              const subject = getMarketingSubjectById(proposal.request.marketingSubjectId || '');
              return (
                <article key={proposal.id} className="ml-card rounded-xl p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-xs font-medium text-slate-500">
                          {formatProposalStatus(proposal.status)}
                        </span>
                        <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-xs font-medium text-slate-500">
                          {subject?.label || 'Not sure yet'}
                        </span>
                        {proposal.expert.verified ? (
                          <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-xs font-medium text-slate-500">
                            Verified
                          </span>
                        ) : null}
                      </div>

                      <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{proposal.expert.businessName}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {formatExpertType(proposal.expert.expertType)} in {proposal.expert.city}, {proposal.expert.state}
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{proposal.request.title}</p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                      <Link
                        href={`/dashboard/customer/requests/view?id=${encodeURIComponent(proposal.request.id)}`}
                        className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900"
                      >
                        Open request
                      </Link>
                      {proposal.status === 'ACCEPTED' ? (
                        <Link
                          href={`/dashboard/customer/messages?proposalId=${encodeURIComponent(proposal.id)}`}
                          className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white"
                        >
                          Open chat
                        </Link>
                      ) : null}
                      <Link
                        href={`/experts/${proposal.expert.slug}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Expert profile
                      </Link>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">Provider note</div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{proposal.message}</p>
                    </div>

                    <div className="grid gap-4">
                      <div className="ml-surface-muted rounded-xl p-4">
                        <div className="text-sm font-semibold text-slate-700">Estimate</div>
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
                    </div>
                  </div>
                  <div className="mt-5">
                    <ProposalDecisionActions proposalId={proposal.id} status={proposal.status} />
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="ml-card mt-5 rounded-xl p-6">
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">No proposals yet</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Create or keep an active request open so matched providers can send proposals.
            </p>
            <Link href="/dashboard/customer/requests/new" className="ml-btn-primary mt-5 inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white">
              Create request
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

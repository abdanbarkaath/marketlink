'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatServiceTokenLabel, getMarketingSubjectById } from '@/lib/marketingTaxonomy';
import { useMarketLinkTheme } from '@/components/ThemeToggle';
import ProposalForm from '../ProposalForm';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type MatchReason = 'same_zip' | 'same_city' | 'serves_nationwide' | 'remote_friendly';
type ProviderRequestStatus = 'ACTIVE' | 'CLOSED' | 'CANCELLED';

type ProviderRequestDetailResponse = {
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
    status: ProviderRequestStatus;
    createdAt: string;
    updatedAt: string;
  };
  match?: {
    primaryReason: MatchReason;
    reasons: MatchReason[];
    matchedServiceTokens: string[];
    requestLocation?: { zip?: string | null; city?: string | null; state?: string | null; source?: string | null } | null;
  };
  proposal?: {
    id: string;
    requestId: string;
    expertId: string;
    message: string;
    priceLabel?: string | null;
    timelineLabel?: string | null;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';
    createdAt: string;
    updatedAt: string;
  } | null;
  error?: string;
};

function formatReason(reason: MatchReason) {
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

function formatStatus(status: ProviderRequestStatus) {
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

function ProviderRequestDetailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useMarketLinkTheme();
  const [data, setData] = useState<ProviderRequestDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const requestId = (searchParams.get('id') || '').trim();

  useEffect(() => {
    if (!requestId) {
      router.replace('/dashboard/requests');
      return;
    }

    (async () => {
      setLoading(true);
      setPageError(null);

      try {
        const summaryRes = await fetch(`${API_BASE}/me/summary`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (summaryRes.status === 401) {
          router.replace(`/login?returnTo=/dashboard/requests/view?id=${encodeURIComponent(requestId)}`);
          return;
        }

        if (!summaryRes.ok) {
          const body = (await summaryRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || `Failed (${summaryRes.status})`);
        }

        const summary = (await summaryRes.json()) as {
          user?: { role?: 'provider' | 'customer' | 'admin' };
        };

        if (summary.user?.role === 'admin') {
          router.replace('/dashboard/admin');
          return;
        }

        if (summary.user?.role === 'customer') {
          router.replace('/dashboard/customer');
          return;
        }

        const res = await fetch(`${API_BASE}/provider/requests/${requestId}`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.status === 404) {
          router.replace('/dashboard/requests');
          return;
        }

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || `Failed (${res.status})`);
        }

        const body = (await res.json()) as ProviderRequestDetailResponse;
        setData(body);
      } catch (error: unknown) {
        setPageError(error instanceof Error ? error.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId, router]);

  const shellClass =
    'rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,244,239,0.96))] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6';

  const request = data?.request;
  const match = data?.match;
  const proposal = data?.proposal;
  const subject = request ? getMarketingSubjectById(request.marketingSubjectId) : null;

  return (
    <main className={`${t.pageBg} min-h-[calc(100vh-72px)]`}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {loading ? (
          <section className={shellClass}>
            <p className={`text-sm ${t.mutedText}`}>Loading request...</p>
          </section>
        ) : pageError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div>
        ) : !request || !match ? (
          <section className={shellClass}>
            <p className={`text-sm ${t.mutedText}`}>Request not found.</p>
          </section>
        ) : (
          <>
            <section className={`${shellClass} overflow-hidden`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Matched request</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{request.title}</h1>
                  <p className={`mt-3 text-sm ${t.mutedText}`}>
                    Created {formatShortDate(request.createdAt)} • {formatStatus(request.status)} • ZIP {request.zip}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/dashboard/requests" className="rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                    Back to inbox
                  </Link>
                  {proposal?.status === 'ACCEPTED' ? (
                    <Link
                      href={`/dashboard/messages?proposalId=${encodeURIComponent(proposal.id)}`}
                      className="rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Open chat
                    </Link>
                  ) : null}
                  <Link href="/dashboard" className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Dashboard
                  </Link>
                </div>
              </div>
            </section>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_340px]">
              <section className={shellClass}>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    {formatStatus(request.status)}
                  </span>
                  <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    {subject?.label || request.marketingSubjectId}
                  </span>
                  <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    {formatReason(match.primaryReason)}
                  </span>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Description</div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{request.description}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Business</div>
                      <div className="mt-1 text-sm font-medium text-slate-900">{request.requesterBusinessName || request.requesterName}</div>
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
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Request tags</div>
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

              <aside className={shellClass}>
                <div className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Why you matched</div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{formatReason(match.primaryReason)}</h2>
                <p className={`mt-2 text-sm ${t.mutedText}`}>
                  This request is shown to you because your current expert profile overlaps on services and location rules.
                </p>

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Matched tags</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {match.matchedServiceTokens.map((token) => (
                        <span
                          key={token}
                          className="inline-flex rounded-xl bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                        >
                          {formatServiceTokenLabel(token)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {match.requestLocation ? (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Request location</div>
                      <div className="mt-1 text-sm font-medium text-slate-900">
                        {[match.requestLocation.city, match.requestLocation.state].filter(Boolean).join(', ') || `ZIP ${request.zip}`}
                      </div>
                    </div>
                  ) : null}
                </div>

                <ProposalForm requestId={request.id} initialProposal={proposal} />
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function ProviderRequestDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="ml-page-bg min-h-[calc(100vh-72px)]">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,244,239,0.96))] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6">
              <p className="text-sm text-slate-600">Loading request...</p>
            </section>
          </div>
        </main>
      }
    >
      <ProviderRequestDetailPageContent />
    </Suspense>
  );
}

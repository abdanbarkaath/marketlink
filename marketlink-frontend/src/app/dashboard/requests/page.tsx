'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatServiceTokenLabel, getMarketingSubjectById } from '@/lib/marketingTaxonomy';
import { useMarketLinkTheme } from '@/components/ThemeToggle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type ProviderRequestStatus = 'ACTIVE' | 'CLOSED' | 'CANCELLED';
type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';
type MatchReason = 'same_zip' | 'same_city' | 'serves_nationwide' | 'remote_friendly';

type ProviderRequestRow = {
  id: string;
  title: string;
  marketingSubjectId: string;
  zip: string;
  budgetLabel?: string | null;
  timelineLabel?: string | null;
  status: ProviderRequestStatus;
  createdAt: string;
  updatedAt: string;
  primaryReason: MatchReason;
  reasons: MatchReason[];
  matchedServiceTokens: string[];
  proposalStatus?: ProposalStatus | null;
};

type ProviderRequestsResponse = {
  ok?: boolean;
  data?: ProviderRequestRow[];
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

function formatProposalStatus(status: ProposalStatus) {
  if (status === 'PENDING') return 'Proposal pending';
  if (status === 'ACCEPTED') return 'Proposal accepted';
  if (status === 'DECLINED') return 'Proposal declined';
  return 'Proposal withdrawn';
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ProviderRequestsPage() {
  const router = useRouter();
  const { t } = useMarketLinkTheme();
  const [rows, setRows] = useState<ProviderRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setPageError(null);

      try {
        const summaryRes = await fetch(`${API_BASE}/me/summary`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (summaryRes.status === 401) {
          router.replace('/login?returnTo=/dashboard/requests');
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

        const res = await fetch(`${API_BASE}/provider/requests`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || `Failed (${res.status})`);
        }

        const body = (await res.json()) as ProviderRequestsResponse;
        setRows(Array.isArray(body.data) ? body.data : []);
      } catch (error: unknown) {
        setPageError(error instanceof Error ? error.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const activeCount = useMemo(() => rows.filter((row) => row.status === 'ACTIVE').length, [rows]);
  const needsProposalCount = useMemo(() => rows.filter((row) => !row.proposalStatus).length, [rows]);
  const pendingProposalCount = useMemo(() => rows.filter((row) => row.proposalStatus === 'PENDING').length, [rows]);
  const acceptedProposalCount = useMemo(() => rows.filter((row) => row.proposalStatus === 'ACCEPTED').length, [rows]);

  const shellClass =
    'rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,244,239,0.96))] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6';
  const mutedCardClass =
    'rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(251,250,248,0.98),rgba(243,239,234,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]';

  return (
    <main className={`${t.pageBg} min-h-[calc(100vh-72px)]`}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className={`${shellClass} overflow-hidden`}>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_320px] lg:items-stretch">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Matched requests</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Incoming opportunities</h1>
              <p className={`mt-3 text-sm ${t.mutedText}`}>
                Review active customer requests that currently match your expert profile based on services and the current locality rules.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">Private provider view</span>
                <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">Active requests only</span>
                <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">Service + locality match</span>
              </div>
            </div>

            <div className={mutedCardClass}>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-[0_18px_34px_rgba(15,23,42,0.18)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Needs proposal</div>
                  <div className="mt-2 text-lg font-semibold">{needsProposalCount}</div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Pending</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{pendingProposalCount}</div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Accepted</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{acceptedProposalCount}</div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Active matches</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{activeCount}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${shellClass} mt-5`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Request inbox</h2>
              <p className={`mt-1 text-sm ${t.mutedText}`}>Open a request to see the full brief and why your profile matched it.</p>
            </div>

            <Link href="/dashboard" className="rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
              Back to dashboard
            </Link>
          </div>
        </section>

        {pageError ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div> : null}

        {loading ? (
          <section className={`${shellClass} mt-5`}>
            <p className={`text-sm ${t.mutedText}`}>Loading matched requests...</p>
          </section>
        ) : rows.length === 0 ? (
          <section className={`${shellClass} mt-5`}>
            <p className={`text-sm ${t.mutedText}`}>No matched requests are available right now.</p>
          </section>
        ) : (
          <div className="mt-5 space-y-4">
            {rows.map((row) => {
              const subject = getMarketingSubjectById(row.marketingSubjectId);

              return (
                <Link
                  key={row.id}
                  href={`/dashboard/requests/view?id=${encodeURIComponent(row.id)}`}
                  className={`${shellClass} block transition ${t.cardHover}`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            {formatStatus(row.status)}
                          </span>
                          <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            {formatReason(row.primaryReason)}
                          </span>
                          {row.proposalStatus ? (
                            <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                              {formatProposalStatus(row.proposalStatus)}
                            </span>
                          ) : (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              Needs proposal
                            </span>
                          )}
                          <span className={`text-xs ${t.mutedText}`}>Created {formatShortDate(row.createdAt)}</span>
                        </div>

                        <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{row.title}</h2>
                        <p className={`mt-2 text-sm ${t.mutedText}`}>
                          {subject?.label || row.marketingSubjectId} • ZIP {row.zip}
                        </p>
                      </div>

                      <span className="text-sm font-semibold text-slate-900">{row.proposalStatus ? 'View proposal' : 'Review and respond'}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {row.matchedServiceTokens.slice(0, 4).map((token) => (
                        <span
                          key={token}
                          className="inline-flex rounded-xl bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                        >
                          {formatServiceTokenLabel(token)}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

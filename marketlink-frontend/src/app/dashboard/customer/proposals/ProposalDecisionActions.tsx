'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';
type ProposalDecisionStatus = 'ACCEPTED' | 'DECLINED';

type ProposalDecisionActionsProps = {
  proposalId: string;
  status: ProposalStatus;
};

function formatProposalStatus(status: ProposalStatus) {
  if (status === 'PENDING') return 'Awaiting your decision';
  if (status === 'ACCEPTED') return 'Accepted';
  if (status === 'DECLINED') return 'Declined';
  return 'Withdrawn';
}

export default function ProposalDecisionActions({ proposalId, status }: ProposalDecisionActionsProps) {
  const router = useRouter();
  const [busyStatus, setBusyStatus] = useState<ProposalDecisionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateProposal(nextStatus: ProposalDecisionStatus) {
    setBusyStatus(nextStatus);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/proposals/${proposalId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || `Failed to update proposal (${response.status})`);
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusyStatus(null);
    }
  }

  if (status !== 'PENDING') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Decision</div>
        <p className="mt-1 text-sm font-semibold text-slate-900">{formatProposalStatus(status)}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Decision</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">Accept the proposal when you want to move forward, or decline it to keep your list clear.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={Boolean(busyStatus)}
          onClick={() => updateProposal('ACCEPTED')}
          className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busyStatus === 'ACCEPTED' ? 'Accepting...' : 'Accept'}
        </button>
        <button
          type="button"
          disabled={Boolean(busyStatus)}
          onClick={() => updateProposal('DECLINED')}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
        >
          {busyStatus === 'DECLINED' ? 'Declining...' : 'Decline'}
        </button>
      </div>

      {error ? (
        <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

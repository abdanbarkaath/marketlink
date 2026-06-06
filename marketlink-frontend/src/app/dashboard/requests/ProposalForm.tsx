'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';

type ProposalSummary = {
  id: string;
  message: string;
  priceLabel?: string | null;
  timelineLabel?: string | null;
  status: ProposalStatus;
  createdAt: string;
};

type ProposalFormProps = {
  requestId: string;
  initialProposal?: ProposalSummary | null;
};

function formatProposalStatus(status: ProposalStatus) {
  if (status === 'PENDING') return 'Pending';
  if (status === 'ACCEPTED') return 'Accepted';
  if (status === 'DECLINED') return 'Declined';
  return 'Withdrawn';
}

export default function ProposalForm({ requestId, initialProposal = null }: ProposalFormProps) {
  const [proposal, setProposal] = useState<ProposalSummary | null>(initialProposal);
  const [message, setMessage] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [timelineLabel, setTimelineLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitProposal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanMessage = message.trim();
    if (!cleanMessage) {
      setError('Proposal message is required.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/provider/requests/${requestId}/proposals`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanMessage,
          priceLabel: priceLabel.trim() || undefined,
          timelineLabel: timelineLabel.trim() || undefined,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as { error?: string; proposal?: ProposalSummary };
      if (!response.ok || !body.proposal) {
        throw new Error(body.error || `Failed to submit proposal (${response.status})`);
      }

      setProposal(body.proposal);
      setMessage('');
      setPriceLabel('');
      setTimelineLabel('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  if (proposal) {
    return (
      <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Proposal submitted</div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            {formatProposalStatus(proposal.status)}
          </span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{proposal.message}</p>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Price</div>
            <div className="mt-1 font-medium text-slate-900">{proposal.priceLabel || 'Not specified'}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Timeline</div>
            <div className="mt-1 font-medium text-slate-900">{proposal.timelineLabel || 'Not specified'}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={submitProposal} className="mt-5 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Send proposal</div>
      <div className="mt-4 grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="proposal-message" className="text-sm font-medium text-slate-700">
            Message
          </label>
          <textarea
            id="proposal-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={4000}
            className="ml-input min-h-32 w-full rounded-2xl px-4 py-3 text-sm text-slate-900"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="proposal-price" className="text-sm font-medium text-slate-700">
              Price
            </label>
            <input
              id="proposal-price"
              value={priceLabel}
              onChange={(event) => setPriceLabel(event.target.value)}
              maxLength={80}
              className="ml-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="proposal-timeline" className="text-sm font-medium text-slate-700">
              Timeline
            </label>
            <input
              id="proposal-timeline"
              value={timelineLabel}
              onChange={(event) => setTimelineLabel(event.target.value)}
              maxLength={80}
              className="ml-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900"
            />
          </div>
        </div>
      </div>

      {error ? (
        <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="ml-btn-primary mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-6 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? 'Submitting proposal...' : 'Submit proposal'}
      </button>
    </form>
  );
}

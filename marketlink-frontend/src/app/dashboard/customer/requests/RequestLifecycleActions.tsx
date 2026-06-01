'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type RequestStatus = 'ACTIVE' | 'CLOSED' | 'CANCELLED';

type RequestLifecycleActionsProps = {
  requestId: string;
  status: RequestStatus;
};

export default function RequestLifecycleActions({ requestId, status }: RequestLifecycleActionsProps) {
  const router = useRouter();
  const [busyStatus, setBusyStatus] = useState<RequestStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(nextStatus: RequestStatus) {
    setBusyStatus(nextStatus);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/requests/${requestId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || `Failed to update request (${response.status})`);
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusyStatus(null);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Request controls</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Active requests can keep matching. Closed requests can be reopened later. Cancelled requests stay in your history but stop here permanently.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {status === 'ACTIVE' ? (
          <>
            <button
              type="button"
              disabled={Boolean(busyStatus)}
              onClick={() => updateStatus('CLOSED')}
              className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900 disabled:opacity-60"
            >
              {busyStatus === 'CLOSED' ? 'Closing...' : 'Close request'}
            </button>
            <button
              type="button"
              disabled={Boolean(busyStatus)}
              onClick={() => updateStatus('CANCELLED')}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            >
              {busyStatus === 'CANCELLED' ? 'Cancelling...' : 'Cancel request'}
            </button>
          </>
        ) : null}

        {status === 'CLOSED' ? (
          <button
            type="button"
            disabled={Boolean(busyStatus)}
            onClick={() => updateStatus('ACTIVE')}
            className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busyStatus === 'ACTIVE' ? 'Reopening...' : 'Reopen request'}
          </button>
        ) : null}
      </div>

      {status === 'CANCELLED' ? <p className="mt-4 text-sm font-medium text-slate-700">This request is cancelled and cannot be reopened.</p> : null}

      {error ? (
        <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

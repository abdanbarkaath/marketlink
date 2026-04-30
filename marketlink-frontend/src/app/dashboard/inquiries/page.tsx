'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMarketLinkTheme } from '@/components/ThemeToggle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type InquiryStatus = 'NEW' | 'READ' | 'ARCHIVED';

type InquiryRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: InquiryStatus;
  createdAt: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DashboardInquiriesPage() {
  const router = useRouter();
  const { t } = useMarketLinkTheme();

  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'archived'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return rows;
    if (filter === 'new') return rows.filter((r) => r.status === 'NEW');
    if (filter === 'read') return rows.filter((r) => r.status === 'READ');
    return rows.filter((r) => r.status === 'ARCHIVED');
  }, [rows, filter]);

  async function load() {
    setPageError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/inquiries`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        router.replace('/login');
        return;
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body?.error || `Failed (${res.status})`);
      }

      const body = (await res.json()) as { ok?: true; data?: InquiryRow[] };
      setRows(Array.isArray(body?.data) ? body.data : []);
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id: string, status: InquiryStatus) {
    setBusyId(id);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

    try {
      const res = await fetch(`${API_BASE}/inquiries/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        await load();
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body?.error || `Failed (${res.status})`);
      }
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : 'Failed to update inquiry');
    } finally {
      setBusyId(null);
    }
  }

  const total = rows.length;
  const newCount = rows.filter((r) => r.status === 'NEW').length;
  const shellClass =
    'rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,244,239,0.96))] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6';
  const mutedCardClass =
    'rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(251,250,248,0.98),rgba(243,239,234,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]';

  const filterButton = (value: 'all' | 'new' | 'read' | 'archived', label: string) => (
    <button
      type="button"
      onClick={() => setFilter(value)}
      className={
        filter === value
          ? 'rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800'
          : 'rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50'
      }
    >
      {label}
    </button>
  );

  return (
    <main className={`${t.pageBg} min-h-[calc(100vh-72px)]`}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className={`${shellClass} overflow-hidden`}>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_320px] lg:items-stretch">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Buyer inquiries</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Inbox</h1>
              <p className={`mt-3 text-sm ${t.mutedText}`}>Review buyer messages, move them through the inbox, and keep the active conversations easy to spot.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">New → Read → Archived</span>
                <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">Mobile-first actions</span>
                <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">Buyer follow-up</span>
              </div>
            </div>

            <div className={mutedCardClass}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-[0_18px_34px_rgba(15,23,42,0.18)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Total</div>
                  <div className="mt-2 text-lg font-semibold">{total}</div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">New</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{newCount}</div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">View</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950 capitalize">{filter}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${shellClass} mt-5`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Filter inbox</h2>
              <p className={`mt-1 text-sm ${t.mutedText}`}>Switch views quickly as inquiries move from new to read to archived.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterButton('all', 'All')}
              {filterButton('new', 'New')}
              {filterButton('read', 'Read')}
              {filterButton('archived', 'Archived')}
            </div>
          </div>
        </section>

        {pageError ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div> : null}

        {loading ? (
          <section className={`${shellClass} mt-5`}>
            <p className={`text-sm ${t.mutedText}`}>Loading inquiries...</p>
          </section>
        ) : filtered.length === 0 ? (
          <section className={`${shellClass} mt-5`}>
            <p className={`text-sm ${t.mutedText}`}>No inquiries here yet.</p>
          </section>
        ) : (
          <div className="mt-5 space-y-4">
            {filtered.map((r) => {
              const busy = busyId === r.id;

              return (
                <article key={r.id} className={shellClass}>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-base font-semibold text-slate-900">{r.name}</div>
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                              r.status === 'NEW'
                                ? 'border-stone-200 bg-stone-50 text-stone-700'
                                : r.status === 'READ'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 bg-slate-100 text-slate-700'
                            }`}
                          >
                            {r.status}
                          </span>
                          <span className={`text-xs ${t.mutedText}`}>{formatDate(r.createdAt)}</span>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-slate-700">
                          <div>
                            <span className={`${t.mutedText} mr-1`}>Email:</span>
                            <span className="break-all">{r.email}</span>
                          </div>
                          {r.phone ? (
                            <div>
                              <span className={`${t.mutedText} mr-1`}>Phone:</span>
                              {r.phone}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {r.status === 'NEW' ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setStatus(r.id, 'READ')}
                            className="rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Mark read
                          </button>
                        ) : null}

                        {r.status === 'READ' ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setStatus(r.id, 'NEW')}
                            className="rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Mark new
                          </button>
                        ) : null}

                        {r.status !== 'ARCHIVED' ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setStatus(r.id, 'ARCHIVED')}
                            className="rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Archive
                          </button>
                        ) : null}

                        {r.status === 'ARCHIVED' ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setStatus(r.id, 'READ')}
                            className="rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Restore
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className={mutedCardClass + ' text-sm leading-6 text-slate-800 whitespace-pre-wrap'}>{r.message}</div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

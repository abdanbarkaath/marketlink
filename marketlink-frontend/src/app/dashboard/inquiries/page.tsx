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
    'ml-card rounded-xl p-5 sm:p-6';
  const mutedCardClass = 'ml-surface-muted rounded-xl p-4';

  const filterButton = (value: 'all' | 'new' | 'read' | 'archived', label: string) => (
    <button
      type="button"
      aria-pressed={filter === value}
      onClick={() => setFilter(value)}
      className={
        filter === value
          ? 'ml-btn-primary inline-flex min-h-11 items-center justify-center px-4 py-2.5 text-sm font-semibold'
          : 'ml-btn-secondary inline-flex min-h-11 items-center justify-center px-4 py-2.5 text-sm font-semibold'
      }
    >
      {label}
    </button>
  );

  return (
    <main className={`${t.pageBg} min-h-[calc(100vh-72px)]`}>
      <div className="dashboard-page-content mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="dashboard-intro p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 max-w-xl">
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Buyer inquiries</h1>
              <p className="dashboard-intro-copy mt-3 text-sm leading-6">
                Review new buyer messages and keep track of the inquiries you’ve read or archived.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/25 pt-4 lg:shrink-0 lg:border-t-0 lg:pt-0">
              <div>
                <dt className="dashboard-intro-copy text-sm">Total inquiries</dt>
                <dd className="mt-1 text-lg font-bold tabular-nums">{total}</dd>
              </div>
              <div>
                <dt className="dashboard-intro-copy text-sm">New</dt>
                <dd className="mt-1 text-lg font-bold tabular-nums">{newCount}</dd>
              </div>
            </dl>
          </div>
        </header>

        <section className={`${shellClass} mt-5`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Filter inbox</h2>
              <p className={`mt-1 text-sm ${t.mutedText}`}>View all inquiries or filter by status.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterButton('all', 'All')}
              {filterButton('new', 'New')}
              {filterButton('read', 'Read')}
              {filterButton('archived', 'Archived')}
            </div>
          </div>
        </section>

        {pageError ? <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div> : null}

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
                            {r.status === 'NEW' ? 'New' : r.status === 'READ' ? 'Read' : 'Archived'}
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
                            className="ml-btn-secondary inline-flex min-h-11 items-center justify-center px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Mark read
                          </button>
                        ) : null}

                        {r.status === 'READ' ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setStatus(r.id, 'NEW')}
                            className="ml-btn-secondary inline-flex min-h-11 items-center justify-center px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Mark new
                          </button>
                        ) : null}

                        {r.status !== 'ARCHIVED' ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setStatus(r.id, 'ARCHIVED')}
                            className="ml-btn-secondary inline-flex min-h-11 items-center justify-center px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Archive
                          </button>
                        ) : null}

                        {r.status === 'ARCHIVED' ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setStatus(r.id, 'READ')}
                            className="ml-btn-secondary inline-flex min-h-11 items-center justify-center px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
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

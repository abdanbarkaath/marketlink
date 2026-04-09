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

function Pill({ children, status, variant = 'default' }: { children: React.ReactNode; status?: InquiryStatus; variant?: 'default' | 'count' }) {
  const { t } = useMarketLinkTheme();

  const statusColors = {
    NEW: 'bg-blue-100 text-blue-800 border-blue-200',
    READ: 'bg-green-100 text-green-800 border-green-200',
    ARCHIVED: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const variantStyles = {
    default: 'bg-white/70 text-slate-700 border-slate-200/80',
    count: `${t.surfaceMuted} ${t.border} text-slate-900 font-semibold backdrop-blur`,
  };

  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${status ? statusColors[status] : variantStyles[variant]}`}>{children}</span>;
}

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
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed (${res.status})`);
      }

      const body = (await res.json()) as { ok: true; data: InquiryRow[] };
      setRows(Array.isArray(body?.data) ? body.data : []);
    } catch (e: any) {
      setPageError(e?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id: string, status: Exclude<InquiryStatus, 'NEW'>) {
    setBusyId(id);

    // optimistic update
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
        // rollback by reloading (simple + reliable)
        await load();
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed (${res.status})`);
      }
    } catch (e: any) {
      setPageError(e?.message ?? 'Failed to update inquiry');
    } finally {
      setBusyId(null);
    }
  }

  const total = rows.length;
  const newCount = rows.filter((r) => r.status === 'NEW').length;

  return (
    <main className={`${t.pageBg} min-h-[calc(100vh-72px)]`}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Inquiries</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Pill variant="count">{total} total</Pill>
              <Pill variant="count">{newCount} new</Pill>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${filter === 'all' ? `${t.primaryBtn} border-transparent` : `${t.secondaryBtn} hover:bg-white/90`}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('new')}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${filter === 'new' ? `${t.primaryBtn} border-transparent` : `${t.secondaryBtn} hover:bg-white/90`}`}
            >
              New
            </button>
            <button
              type="button"
              onClick={() => setFilter('read')}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${filter === 'read' ? `${t.primaryBtn} border-transparent` : `${t.secondaryBtn} hover:bg-white/90`}`}
            >
              Read
            </button>
            <button
              type="button"
              onClick={() => setFilter('archived')}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${filter === 'archived' ? `${t.primaryBtn} border-transparent` : `${t.secondaryBtn} hover:bg-white/90`}`}
            >
              Archived
            </button>
          </div>
        </div>

        {pageError ? <div className={`mt-6 rounded-2xl ${t.surface} ${t.border} border-red-200 bg-red-50/80 backdrop-blur p-4 text-sm text-red-700`}>{pageError}</div> : null}

        {loading ? (
          <div className={`mt-6 rounded-2xl ${t.surface} ${t.border} p-6 backdrop-blur`}>
            <p className={`text-sm ${t.mutedText}`}>Loading inquiries…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`mt-6 rounded-2xl ${t.surface} ${t.border} p-6 backdrop-blur`}>
            <p className={`text-sm ${t.mutedText}`}>No inquiries here yet.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filtered.map((r) => {
              const busy = busyId === r.id;
              return (
                <article key={r.id} className={`rounded-2xl ${t.card} ${t.cardHover} backdrop-blur`}>
                  <div className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                          <Pill status={r.status}>{r.status}</Pill>
                          <span className={`text-xs ${t.mutedText}`}>{formatDate(r.createdAt)}</span>
                        </div>

                        <div className="mt-2 text-sm text-slate-700">
                          <div>
                            <span className={t.mutedText}>Email:</span> {r.email}
                          </div>
                          {r.phone ? (
                            <div>
                              <span className={t.mutedText}>Phone:</span> {r.phone}
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
                            className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${busy ? 'opacity-60 cursor-not-allowed' : `${t.secondaryBtn} hover:bg-white/90`}`}
                          >
                            Mark read
                          </button>
                        ) : null}

                        {r.status !== 'ARCHIVED' ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setStatus(r.id, 'ARCHIVED')}
                            className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${busy ? 'opacity-60 cursor-not-allowed' : `${t.secondaryBtn} hover:bg-white/90`}`}
                          >
                            Archive
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 whitespace-pre-wrap rounded-xl border bg-slate-50/80 backdrop-blur p-3 text-sm text-slate-800">{r.message}</div>
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

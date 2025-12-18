'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'NEW' | 'READ' | 'ARCHIVED';
  createdAt: string;
};

function StatusPill({ status }: { status: Inquiry['status'] }) {
  const cls = status === 'NEW' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : status === 'READ' ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-gray-200 bg-gray-50 text-gray-700';

  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}

export default function DashboardInquiriesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Inquiry[]>([]);

  const newCount = useMemo(() => rows.filter((r) => r.status === 'NEW').length, [rows]);

  async function load() {
    setError(null);
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

      const body = (await res.json()) as { ok: true; data: Inquiry[] };
      setRows(Array.isArray(body?.data) ? body.data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inquiries</h1>
          <p className="mt-2 text-sm text-gray-600">Leads sent to your provider profile. {newCount > 0 ? <span className="font-medium text-gray-900">{newCount} new</span> : 'No new leads.'}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard" className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50">
            Back to dashboard
          </Link>
          <button onClick={load} className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Refresh
          </button>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        {loading ? <p className="text-sm text-gray-600">Loading inquiries…</p> : null}

        {!loading && error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">Error: {error}</p>
          </div>
        ) : null}

        {!loading && !error && rows.length === 0 ? (
          <div className="rounded-xl border bg-gray-50 p-5">
            <div className="text-sm font-semibold">No inquiries yet</div>
            <p className="mt-1 text-sm text-gray-600">When someone submits the contact form on your public page, it will show up here.</p>
          </div>
        ) : null}

        {!loading && !error && rows.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border">
            <div className="grid grid-cols-12 gap-3 border-b bg-gray-50 px-4 py-3 text-xs font-medium text-gray-600">
              <div className="col-span-4">Contact</div>
              <div className="col-span-6">Message</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            <div className="divide-y">
              {rows.map((r) => (
                <div key={r.id} className="grid grid-cols-12 gap-3 px-4 py-3">
                  <div className="col-span-12 md:col-span-4">
                    <div className="text-sm font-semibold text-gray-900">{r.name}</div>
                    <div className="mt-1 text-sm text-gray-700 break-all">{r.email}</div>
                    {r.phone ? <div className="mt-1 text-xs text-gray-500">{r.phone}</div> : null}
                    <div className="mt-2 text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>

                  <div className="col-span-12 md:col-span-6">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.message}</p>
                  </div>

                  <div className="col-span-12 md:col-span-2 md:text-right">
                    <StatusPill status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

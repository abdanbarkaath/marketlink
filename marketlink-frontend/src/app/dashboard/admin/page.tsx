import React from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

type StatsResponse = {
  pendingCount: number;
  activeCount: number;
  disabledCount: number;
  verifiedCount: number;
  // backend may still send this; we ignore it
  inquiriesNewCount?: number;
};

type ProviderItem = {
  id: string;
  slug: string;
  businessName: string;
  email: string;
  city: string;
  state: string;
  status: 'pending' | 'active' | 'disabled';
  verified: boolean;
  disabledReason?: string | null;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
};

type AdminListResponse = {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    status?: 'pending' | 'active' | 'disabled';
    query?: string;
    verified?: boolean;
  };
  data: ProviderItem[];
};

function toQS(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && String(v).trim() !== '') usp.set(k, String(v));
  });
  return usp.toString();
}

function StatusBadge({ status }: { status: ProviderItem['status'] }) {
  const cls = status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200';

  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${cls}`}>{status}</span>;
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-block rounded-full border px-2 py-0.5 text-xs bg-green-50 text-green-700 border-green-200">Verified</span>
  ) : (
    <span className="inline-block rounded-full border px-2 py-0.5 text-xs bg-gray-50 text-gray-600 border-gray-200">No</span>
  );
}

function StatCardLink({ label, value, href, hint }: { label: string; value: number; href: string; hint?: string }) {
  return (
    <Link href={href} className="block rounded-2xl border bg-white p-4 shadow-sm hover:bg-gray-50">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint ? <div className="mt-2 text-xs text-gray-500">{hint}</div> : null}
    </Link>
  );
}

// Server-side helper that forwards cookie + uses PATCH
async function adminPATCH(path: string, body: any) {
  'use server';
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const cookie = headers().get('cookie') || '';

  const res = await fetch(`${apiBase}${path}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Admin action failed (${res.status}): ${txt}`);
  }
}

export default async function AdminOverviewPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const cookie = headers().get('cookie') || '';

  const query = typeof searchParams.query === 'string' ? searchParams.query : undefined;

  // status: '' (Any) | pending | active | disabled
  const status = typeof searchParams.status === 'string' ? searchParams.status : '';

  // verified: '' (Any) | 'true' | 'false'
  const verified = typeof searchParams.verified === 'string' ? searchParams.verified : '';

  const page = Math.max(1, parseInt(String(searchParams.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(searchParams.limit ?? '20'), 10) || 20));

  // ---- STATS ----
  const statsRes = await fetch(`${apiBase}/admin/stats`, {
    cache: 'no-store',
    headers: { 'content-type': 'application/json', cookie },
  });

  if (statsRes.status === 401 || statsRes.status === 403) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Admin</h1>
        <p className="text-red-600">You are not authorized to view this page.</p>
      </main>
    );
  }

  if (!statsRes.ok) {
    const txt = await statsRes.text();
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Admin</h1>
        <p className="text-red-600">Failed to load stats.</p>
        <pre className="mt-3 rounded border bg-gray-50 p-3 text-xs overflow-auto">{txt}</pre>
      </main>
    );
  }

  const stats = (await statsRes.json()) as StatsResponse;
  const totalProviders = (stats.pendingCount || 0) + (stats.activeCount || 0) + (stats.disabledCount || 0);

  // ---- LIST ----
  const listQS = toQS({
    status: status || undefined,
    query,
    verified: verified || undefined,
    page: String(page),
    limit: String(limit),
  });

  const listRes = await fetch(`${apiBase}/admin/providers?${listQS}`, {
    cache: 'no-store',
    headers: { 'content-type': 'application/json', cookie },
  });

  if (listRes.status === 401 || listRes.status === 403) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Admin</h1>
        <p className="text-red-600">You are not authorized to view this page.</p>
      </main>
    );
  }

  if (!listRes.ok) {
    const txt = await listRes.text();
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Admin</h1>
        <p className="text-red-600">Failed to load admin list.</p>
        <pre className="mt-3 rounded border bg-gray-50 p-3 text-xs overflow-auto">{txt}</pre>
      </main>
    );
  }

  // Defensive parsing to avoid "list.data is undefined"
  const listJson = (await listRes.json().catch(() => ({}))) as Partial<AdminListResponse>;
  const rows: ProviderItem[] = Array.isArray(listJson?.data) ? (listJson!.data as ProviderItem[]) : [];
  const meta = listJson?.meta || {
    total: rows.length,
    page,
    limit,
    totalPages: 1,
  };

  // ---- Server Actions ----
  const approve = async (formData: FormData) => {
    'use server';
    const id = String(formData.get('id') || '');
    await adminPATCH(`/admin/providers/${id}`, { status: 'active' });
    revalidatePath('/dashboard/admin');
  };

  const enableProvider = async (formData: FormData) => {
    'use server';
    const id = String(formData.get('id') || '');
    await adminPATCH(`/admin/providers/${id}`, { status: 'active' });
    revalidatePath('/dashboard/admin');
  };

  const disableProvider = async (formData: FormData) => {
    'use server';
    const id = String(formData.get('id') || '');
    const reason = String(formData.get('reason') || '').trim();

    // Friendly guard before backend throws
    if (!reason) {
      throw new Error('Please enter a disabled reason.');
    }

    await adminPATCH(`/admin/providers/${id}`, { status: 'disabled', disabledReason: reason });
    revalidatePath('/dashboard/admin');
  };

  const toggleVerify = async (formData: FormData) => {
    'use server';
    const id = String(formData.get('id') || '');
    const current = String(formData.get('currentVerified') || 'false') === 'true';
    await adminPATCH(`/admin/providers/${id}`, { verified: !current });
    revalidatePath('/dashboard/admin');
  };

  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);

  // Build quick-filter links that preserve query/limit
  const baseQS = (patch: Record<string, string | undefined>) =>
    toQS({
      query,
      limit: String(limit),
      page: '1',
      ...patch,
    });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold">Admin Overview</h1>
          <p className="text-sm text-gray-500">Moderate providers and manage listings.</p>
        </div>
      </div>

      {/* Clickable Stats / Quick Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCardLink label="Providers (Total)" value={totalProviders} href={`/dashboard/admin?${baseQS({ status: undefined, verified: undefined })}`} hint="Show all" />
        <StatCardLink label="Active" value={stats.activeCount || 0} href={`/dashboard/admin?${baseQS({ status: 'active', verified: verified || undefined })}`} hint="Filter active" />
        <StatCardLink label="Pending" value={stats.pendingCount || 0} href={`/dashboard/admin?${baseQS({ status: 'pending', verified: verified || undefined })}`} hint="Filter pending" />
        <StatCardLink label="Disabled" value={stats.disabledCount || 0} href={`/dashboard/admin?${baseQS({ status: 'disabled', verified: verified || undefined })}`} hint="Filter disabled" />
        <StatCardLink label="Verified" value={stats.verifiedCount || 0} href={`/dashboard/admin?${baseQS({ verified: 'true', status: status || undefined })}`} hint="Filter verified" />
      </div>

      {/* Filters */}
      <form method="GET" className="rounded-2xl border bg-white p-4 flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium">
          Search
          <input type="text" name="query" placeholder="business/email/city/state/tagline/notes" defaultValue={query ?? ''} className="ml-2 rounded border px-2 py-1 text-sm w-72" />
        </label>

        <label className="text-sm font-medium">
          Status
          <select name="status" defaultValue={status} className="ml-2 rounded border px-2 py-1 text-sm">
            <option value="">Any</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>

        <label className="text-sm font-medium">
          Verified
          <select name="verified" defaultValue={verified} className="ml-2 rounded border px-2 py-1 text-sm">
            <option value="">Any</option>
            <option value="true">Verified</option>
            <option value="false">Not Verified</option>
          </select>
        </label>

        <label className="text-sm font-medium">
          Page size
          <select name="limit" defaultValue={String(limit)} className="ml-2 rounded border px-2 py-1 text-sm">
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="50">50</option>
          </select>
        </label>

        <input type="hidden" name="page" value="1" />
        <button className="rounded bg-black text-white text-sm px-3 py-1">Apply</button>

        <Link href="/dashboard/admin" className="text-sm px-3 py-1 rounded border hover:bg-gray-50" title="Clear filters">
          Clear
        </Link>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Rating</th>
              <th className="px-3 py-2">Verified</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center">
                  <div className="text-gray-700 font-medium">No results</div>
                  <div className="text-xs text-gray-500 mt-1">Try clearing filters or searching a different term.</div>
                  <div className="mt-3">
                    <Link href="/dashboard/admin" className="inline-block rounded border px-3 py-1 text-sm hover:bg-gray-50">
                      Clear filters
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">
                      <Link href={`/providers/${p.slug}`} className="hover:underline">
                        {p.businessName}
                      </Link>
                    </div>
                    {p.disabledReason ? <div className="text-xs text-gray-500 mt-0.5">Disabled reason: {p.disabledReason}</div> : null}
                  </td>

                  <td className="px-3 py-2">{p.email}</td>

                  <td className="px-3 py-2">
                    {p.city}, {p.state}
                  </td>

                  <td className="px-3 py-2">{typeof p.rating === 'number' ? p.rating.toFixed(1) : '0.0'}</td>

                  <td className="px-3 py-2">
                    <VerifiedBadge verified={!!p.verified} />
                  </td>

                  <td className="px-3 py-2">
                    <StatusBadge status={p.status} />
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {/* Edit */}
                      <Link href={`/dashboard/admin/providers/${p.id}`} className="px-2 py-1 rounded border text-xs hover:bg-gray-50">
                        Edit
                      </Link>

                      {p.status === 'pending' ? (
                        <form action={approve}>
                          <input type="hidden" name="id" value={p.id} />
                          <button className="px-2 py-1 rounded border text-xs hover:bg-gray-50">Approve</button>
                        </form>
                      ) : null}

                      <form action={toggleVerify}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="currentVerified" value={String(p.verified)} />
                        <button className="px-2 py-1 rounded border text-xs hover:bg-gray-50">{p.verified ? 'Unverify' : 'Verify'}</button>
                      </form>

                      {p.status !== 'disabled' ? (
                        <form action={disableProvider} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={p.id} />
                          <input type="text" name="reason" placeholder="reason (required)" className="px-2 py-1 rounded border text-xs w-40" required minLength={2} />
                          <button className="px-2 py-1 rounded border text-xs hover:bg-gray-50">Disable</button>
                        </form>
                      ) : null}

                      {p.status === 'disabled' ? (
                        <form action={enableProvider}>
                          <input type="hidden" name="id" value={p.id} />
                          <button className="px-2 py-1 rounded border text-xs hover:bg-gray-50">Enable</button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-2 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {start}–{end} of {meta.total}
        </div>

        <div className="flex items-center gap-2">
          <Link
            aria-disabled={meta.page <= 1}
            className={`px-3 py-1 rounded border text-sm ${meta.page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
            href={`/dashboard/admin?${toQS({
              query,
              status: status || undefined,
              verified: verified || undefined,
              limit: String(limit),
              page: String(Math.max(1, meta.page - 1)),
            })}`}
          >
            ← Prev
          </Link>

          <span className="text-sm">
            Page {meta.page} / {meta.totalPages}
          </span>

          <Link
            aria-disabled={meta.page >= meta.totalPages}
            className={`px-3 py-1 rounded border text-sm ${meta.page >= meta.totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
            href={`/dashboard/admin?${toQS({
              query,
              status: status || undefined,
              verified: verified || undefined,
              limit: String(limit),
              page: String(Math.min(meta.totalPages, meta.page + 1)),
            })}`}
          >
            Next →
          </Link>
        </div>
      </div>
    </main>
  );
}

import React from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { apiJSON } from '../../lib/serverApi';

export const dynamic = 'force-dynamic';

type StatsResponse = {
  ok: true;
  providers: {
    total: number;
    active: number;
    pending: number;
    disabled: number;
    verified: number;
  };
};

type ProviderItem = {
  id: string;
  businessName: string;
  email: string;
  city: string;
  state: string;
  verified: boolean;
  status: 'pending' | 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
  slug: string;
  rating: number;
  services: string[];
};

type AdminList = {
  ok: boolean;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  items: ProviderItem[];
};

function toQS(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && String(v).trim() !== '') usp.set(k, String(v));
  });
  return usp.toString();
}

// Minimal server-side POST helper that forwards the admin cookie
async function adminPOST(path: string, body?: any) {
  'use server';
  const apiBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const cookie = headers().get('cookie') || '';
  const res = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Admin action failed (${res.status}): ${txt}`);
  }
}

function StatusBadge({ status }: { status: ProviderItem['status'] }) {
  const cls = status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200';
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${cls}`}>{status}</span>;
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default async function AdminOverviewPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  // Filters
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const city = typeof searchParams.city === 'string' ? searchParams.city : undefined;
  const status = typeof searchParams.status === 'string' ? searchParams.status : undefined; // pending|active|disabled
  const verified = typeof searchParams.verified === 'string' ? searchParams.verified : undefined; // true|false
  const page = Math.max(1, parseInt(String(searchParams.page ?? '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(searchParams.limit ?? '20'), 10) || 20));

  const listQS = toQS({ q, city, status, verified, page: String(page), limit: String(limit) });

  // Fetch stats with your helper (forwarding cookies inside apiJSON)
  const stats = await apiJSON<StatsResponse>('/admin/stats');

  // Fetch list (use fetch directly to preserve cookie via headers())
  const apiBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const cookie = headers().get('cookie') || '';
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
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Admin</h1>
        <p className="text-red-600">Failed to load admin list.</p>
      </main>
    );
  }
  const list = (await listRes.json()) as AdminList;

  const { total, active, pending, disabled, verified: verifiedCount } = stats.providers;

  // Pagination links
  const baseParams = { q, city, status, verified, limit: String(limit) };
  const prevParams = toQS({ ...baseParams, page: String(Math.max(1, page - 1)) });
  const nextParams = toQS({
    ...baseParams,
    page: String(Math.min(list.meta.totalPages, page + 1)),
  });

  // Server Actions
  const approve = async (formData: FormData) => {
    'use server';
    const id = String(formData.get('id') || '');
    await adminPOST(`/admin/providers/${id}/approve`);
  };
  const toggleVerify = async (formData: FormData) => {
    'use server';
    const id = String(formData.get('id') || '');
    await adminPOST(`/admin/providers/${id}/verify`, {}); // toggle when body empty
  };
  const setVerify = async (formData: FormData) => {
    'use server';
    const id = String(formData.get('id') || '');
    const value = String(formData.get('value') || 'true') === 'true';
    await adminPOST(`/admin/providers/${id}/verify`, { value });
  };
  const disableProvider = async (formData: FormData) => {
    'use server';
    const id = String(formData.get('id') || '');
    const reason = String(formData.get('reason') || '');
    await adminPOST(`/admin/providers/${id}/disable`, { reason });
  };
  const enableProvider = async (formData: FormData) => {
    'use server';
    const id = String(formData.get('id') || '');
    await adminPOST(`/admin/providers/${id}/enable`);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold">Admin Overview</h1>
          <p className="text-sm text-gray-500">Moderate providers and view platform stats.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card label="Total" value={total} />
        <Card label="Active" value={active} />
        <Card label="Pending" value={pending} />
        <Card label="Disabled" value={disabled} />
        <Card label="Verified" value={verifiedCount} />
      </div>

      {/* Filters */}
      <form method="GET" className="rounded border p-3 flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium">
          Search
          <input type="text" name="q" placeholder="name/email/tagline/notes" defaultValue={q ?? ''} className="ml-2 rounded border px-2 py-1 text-sm w-64" />
        </label>

        <label className="text-sm font-medium">
          City
          <input type="text" name="city" placeholder="city prefix" defaultValue={city ?? ''} className="ml-2 rounded border px-2 py-1 text-sm w-40" />
        </label>

        <label className="text-sm font-medium">
          Status
          <select name="status" defaultValue={status ?? ''} className="ml-2 rounded border px-2 py-1 text-sm">
            <option value="">Any</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>

        <label className="text-sm font-medium">
          Verified
          <select name="verified" defaultValue={verified ?? ''} className="ml-2 rounded border px-2 py-1 text-sm">
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
            <option value="100">100</option>
          </select>
        </label>

        <input type="hidden" name="page" value="1" />
        <button className="rounded bg-black text-white text-sm px-3 py-1">Apply</button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded border">
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
            {list.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No results.
                </td>
              </tr>
            ) : (
              list.items.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">
                      <Link href={`/providers/${p.slug}`} className="hover:underline">
                        {p.businessName}
                      </Link>
                    </div>
                    <div className="text-xs text-gray-500">
                      {p.services.slice(0, 3).join(', ')}
                      {p.services.length > 3 ? ` +${p.services.length - 3} more` : ''}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-gray-800">{p.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    {p.city}, {p.state}
                  </td>
                  <td className="px-3 py-2">{p.rating?.toFixed?.(1) ?? '0.0'}</td>
                  <td className="px-3 py-2">
                    {p.verified ? (
                      <span className="inline-block rounded-full border px-2 py-0.5 text-xs bg-green-50 text-green-700 border-green-200">Verified</span>
                    ) : (
                      <span className="inline-block rounded-full border px-2 py-0.5 text-xs bg-gray-50 text-gray-600 border-gray-200">No</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {/* Approve (set active) */}
                      {p.status === 'pending' ? (
                        <form action={approve}>
                          <input type="hidden" name="id" value={p.id} />
                          <button className="px-2 py-1 rounded border text-xs hover:bg-gray-50">Approve</button>
                        </form>
                      ) : null}

                      {/* Toggle Verify */}
                      <form action={toggleVerify}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="px-2 py-1 rounded border text-xs hover:bg-gray-50">{p.verified ? 'Unverify' : 'Verify'}</button>
                      </form>

                      {/* Disable with reason */}
                      {p.status !== 'disabled' ? (
                        <form action={disableProvider} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={p.id} />
                          <input type="text" name="reason" placeholder="reason" className="px-2 py-1 rounded border text-xs" />
                          <button className="px-2 py-1 rounded border text-xs hover:bg-gray-50">Disable</button>
                        </form>
                      ) : null}

                      {/* Enable */}
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
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {(list.meta.page - 1) * list.meta.limit + 1}–{Math.min(list.meta.page * list.meta.limit, list.meta.total)} of {list.meta.total}
        </div>
        <div className="flex items-center gap-2">
          <Link
            aria-disabled={page <= 1}
            className={`px-3 py-1 rounded border text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
            href={`/admin?${toQS({ ...baseParams, page: String(Math.max(1, page - 1)) })}`}
          >
            ← Prev
          </Link>
          <span className="text-sm">
            Page {list.meta.page} / {list.meta.totalPages}
          </span>
          <Link
            aria-disabled={page >= list.meta.totalPages}
            className={`px-3 py-1 rounded border text-sm ${page >= list.meta.totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
            href={`/admin?${toQS({
              ...baseParams,
              page: String(Math.min(list.meta.totalPages, page + 1)),
            })}`}
          >
            Next →
          </Link>
        </div>
      </div>
    </main>
  );
}

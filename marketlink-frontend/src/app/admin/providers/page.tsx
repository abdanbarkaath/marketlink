import React from 'react';
import { apiJSON, apiFetch } from '../../../lib/serverApi';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Flash, ConfirmSubmit } from '../../../components/admin/ClientBits';

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
  rating: number | null;
  services: string[];
};

type ListResponse = {
  ok: true;
  count: number;
  items: ProviderItem[];
};

function statusColor(status: ProviderItem['status']) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'disabled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

// ----- Server actions (call backend with forwarded cookie) -----
async function approveAction(formData: FormData) {
  'use server';
  const id = String(formData.get('id') || '');
  const res = await apiFetch(`/admin/providers/${id}/approve`, { method: 'POST' });
  if (!res.ok) throw new Error('Approve failed');
  revalidatePath('/admin/providers');
  redirect('/admin/providers?flash=Approved');
}

async function verifyToggleAction(formData: FormData) {
  'use server';
  const id = String(formData.get('id') || '');
  const next = formData.get('next') === 'true';
  const res = await apiFetch(`/admin/providers/${id}/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ value: next }),
  });
  if (!res.ok) throw new Error('Verify toggle failed');
  revalidatePath('/admin/providers');
  redirect(`/admin/providers?flash=${encodeURIComponent(next ? 'Verified' : 'Unverified')}`);
}

async function disableAction(formData: FormData) {
  'use server';
  const id = String(formData.get('id') || '');
  const reason = String(formData.get('reason') || '');
  const res = await apiFetch(`/admin/providers/${id}/disable`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Disable failed');
  revalidatePath('/admin/providers');
  redirect('/admin/providers?flash=Disabled');
}

async function enableAction(formData: FormData) {
  'use server';
  const id = String(formData.get('id') || '');
  const res = await apiFetch(`/admin/providers/${id}/enable`, { method: 'POST' });
  if (!res.ok) throw new Error('Enable failed');
  revalidatePath('/admin/providers');
  redirect('/admin/providers?flash=Enabled');
}

// Utility for building querystring safely
function qs(params: Record<string, string | undefined>) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') s.set(k, v);
  });
  return s.toString();
}

export default async function AdminProvidersPage({ searchParams }: { searchParams: { q?: string; status?: string; verified?: string; page?: string; limit?: string; flash?: string } }) {
  const q = searchParams.q ?? '';
  const status = searchParams.status ?? '';
  const verified = searchParams.verified ?? '';
  const limit = parseInt(searchParams.limit ?? '20', 10);
  const page = Math.max(parseInt(searchParams.page ?? '1', 10), 1);
  const offset = (page - 1) * limit;
  const flash = searchParams.flash ?? '';

  const query = qs({ q, status, verified, limit: String(limit), offset: String(offset) });
  const data = await apiJSON<ListResponse>(`/admin/providers?${query}`);
  const totalPages = Math.max(1, Math.ceil(data.count / limit));

  return (
    <div className="space-y-6">
      {/* flash toast */}
      <Flash message={flash} />

      <h1 className="text-xl font-semibold">Providers</h1>

      {/* Filters (GET form) */}
      <form className="flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Search</label>
          <input name="q" defaultValue={q} placeholder="Name, email, city, state" className="rounded-xl border px-3 py-2" />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Status</label>
          <select name="status" defaultValue={status} className="rounded-xl border px-3 py-2">
            <option value="">Any</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Verified</label>
          <select name="verified" defaultValue={verified} className="rounded-xl border px-3 py-2">
            <option value="">Any</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Per page</label>
          <select name="limit" defaultValue={String(limit)} className="rounded-xl border px-3 py-2">
            <option>10</option>
            <option>20</option>
            <option>50</option>
          </select>
        </div>

        <button className="rounded-xl bg-black px-4 py-2 text-white">Apply</button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.businessName}</div>
                  <div className="text-xs text-gray-500">/{p.slug}</div>
                </td>
                <td className="px-4 py-3">{p.email}</td>
                <td className="px-4 py-3">
                  {p.city}, {p.state}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${statusColor(p.status)}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3">
                  {p.verified ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Yes</span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">No</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {/* Approve (-> active) */}
                    {p.status !== 'active' && (
                      <ConfirmSubmit action={approveAction} message={`Approve "${p.businessName}"?`}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="rounded border px-2 py-1 text-xs hover:bg-gray-50">Approve</button>
                      </ConfirmSubmit>
                    )}

                    {/* Verify toggle */}
                    <ConfirmSubmit action={verifyToggleAction} message={`${p.verified ? 'Unverify' : 'Verify'} "${p.businessName}"?`}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="next" value={(!p.verified).toString()} />
                      <button className="rounded border px-2 py-1 text-xs hover:bg-gray-50">{p.verified ? 'Unverify' : 'Verify'}</button>
                    </ConfirmSubmit>

                    {/* Disable with reason (confirm) */}
                    {p.status !== 'disabled' ? (
                      <ConfirmSubmit action={disableAction} message={`Disable "${p.businessName}"?`} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={p.id} />
                        <input name="reason" placeholder="reason" className="w-32 rounded border px-2 py-1 text-xs" />
                        <button className="rounded border px-2 py-1 text-xs text-red-700 hover:bg-red-50">Disable</button>
                      </ConfirmSubmit>
                    ) : (
                      <ConfirmSubmit action={enableAction} message={`Enable "${p.businessName}"?`}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="rounded border px-2 py-1 text-xs text-green-700 hover:bg-green-50">Enable</button>
                      </ConfirmSubmit>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {data.items.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>
                  No providers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {Math.min(offset + 1, data.count)}–{Math.min(offset + data.items.length, data.count)} of {data.count}
        </div>
        <div className="flex gap-2">
          <a className={`rounded border px-3 py-1 text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`} href={`?${qs({ q, status, verified, limit: String(limit), page: String(page - 1) })}`}>
            Prev
          </a>
          <a
            className={`rounded border px-3 py-1 text-sm ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
            href={`?${qs({ q, status, verified, limit: String(limit), page: String(page + 1) })}`}
          >
            Next
          </a>
        </div>
      </div>
    </div>
  );
}

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
  const cls =
    status === 'active'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'pending'
      ? 'border-stone-200 bg-stone-50 text-stone-700'
      : 'border-red-200 bg-red-50 text-red-700';

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${cls}`}>{status}</span>;
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Verified</span>
  ) : (
    <span className="inline-flex rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">Not verified</span>
  );
}

function StatCardLink({ label, value, href, hint }: { label: string; value: number; href: string; hint?: string }) {
  return (
    <Link
      href={href}
      className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,244,239,0.96))] p-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,238,233,0.98))]"
    >
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
      {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
    </Link>
  );
}

async function adminPATCH(path: string, body: unknown) {
  'use server';
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const requestHeaders = await headers();
  const cookie = requestHeaders.get('cookie') || '';

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

type AdminOverviewPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOverviewPage({ searchParams }: AdminOverviewPageProps) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const requestHeaders = await headers();
  const cookie = requestHeaders.get('cookie') || '';
  const resolvedSearchParams = await searchParams;

  const query = typeof resolvedSearchParams.query === 'string' ? resolvedSearchParams.query : undefined;
  const status = typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : '';
  const verified = typeof resolvedSearchParams.verified === 'string' ? resolvedSearchParams.verified : '';
  const page = Math.max(1, parseInt(String(resolvedSearchParams.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(resolvedSearchParams.limit ?? '20'), 10) || 20));

  const statsRes = await fetch(`${apiBase}/admin/stats`, {
    cache: 'no-store',
    headers: { 'content-type': 'application/json', cookie },
  });

  if (statsRes.status === 401 || statsRes.status === 403) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-red-600">You are not authorized to view this page.</p>
      </main>
    );
  }

  if (!statsRes.ok) {
    const txt = await statsRes.text();
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-red-600">Failed to load stats.</p>
        <pre className="mt-4 overflow-auto rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-xs">{txt}</pre>
      </main>
    );
  }

  const stats = (await statsRes.json()) as StatsResponse;
  const totalProviders = (stats.pendingCount || 0) + (stats.activeCount || 0) + (stats.disabledCount || 0);

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
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-red-600">You are not authorized to view this page.</p>
      </main>
    );
  }

  if (!listRes.ok) {
    const txt = await listRes.text();
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-red-600">Failed to load admin list.</p>
        <pre className="mt-4 overflow-auto rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-xs">{txt}</pre>
      </main>
    );
  }

  const listJson = (await listRes.json().catch(() => ({}))) as Partial<AdminListResponse>;
  const rows: ProviderItem[] = Array.isArray(listJson?.data) ? (listJson.data as ProviderItem[]) : [];
  const meta = listJson?.meta || {
    total: rows.length,
    page,
    limit,
    totalPages: 1,
  };

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
    if (!reason) throw new Error('Please enter a disabled reason.');
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

  const baseQS = (patch: Record<string, string | undefined>) =>
    toQS({
      query,
      limit: String(limit),
      page: '1',
      ...patch,
    });

  const shellClass =
    'rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,244,239,0.96))] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6';
  const mutedPanelClass =
    'rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(251,250,248,0.98),rgba(243,239,234,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]';
  const fieldClass = 'w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200/70';
  const secondaryButtonClass = 'rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50';
  const subtlePillClass = 'rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm';

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <section className={`${shellClass} overflow-hidden`}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)] lg:items-stretch">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Platform operations</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Admin overview</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Moderate provider listings, verify profiles, and keep the marketplace clean without forcing admins through dense tables first.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className={subtlePillClass}>Mobile-first moderation</span>
              <span className={subtlePillClass}>Provider verification</span>
              <span className={subtlePillClass}>Fast review workflow</span>
            </div>
          </div>

          <div className={`${mutedPanelClass} flex flex-col justify-between`}>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Today</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-[0_18px_34px_rgba(15,23,42,0.18)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Pending</div>
                  <div className="mt-2 text-2xl font-semibold">{stats.pendingCount || 0}</div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">New leads</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">{stats.inquiriesNewCount || 0}</div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/dashboard/admin/invite" className="rounded-full bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800">
                Invite user
              </Link>
              <Link href="/dashboard/admin?status=pending" className={secondaryButtonClass}>
                Review pending profiles
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCardLink label="Providers" value={totalProviders} href={`/dashboard/admin?${baseQS({ status: undefined, verified: undefined })}`} hint="Show all" />
        <StatCardLink label="Active" value={stats.activeCount || 0} href={`/dashboard/admin?${baseQS({ status: 'active', verified: verified || undefined })}`} hint="Filter active" />
        <StatCardLink label="Pending" value={stats.pendingCount || 0} href={`/dashboard/admin?${baseQS({ status: 'pending', verified: verified || undefined })}`} hint="Filter pending" />
        <StatCardLink label="Disabled" value={stats.disabledCount || 0} href={`/dashboard/admin?${baseQS({ status: 'disabled', verified: verified || undefined })}`} hint="Filter disabled" />
        <StatCardLink label="Verified" value={stats.verifiedCount || 0} href={`/dashboard/admin?${baseQS({ verified: 'true', status: status || undefined })}`} hint="Filter verified" />
      </section>

      <section className={`${shellClass} mt-5`}>
        <details className="group md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
              <p className="mt-1 text-sm text-slate-500">Search and narrow the provider list.</p>
            </div>
            <span className={`${subtlePillClass} group-open:hidden`}>Show</span>
            <span className={`hidden ${subtlePillClass} group-open:inline-flex`}>Hide</span>
          </summary>
          <div className="mt-4">
            <form method="GET" className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Search</label>
                <input type="text" name="query" placeholder="business, email, city, state..." defaultValue={query ?? ''} className={fieldClass} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                  <select name="status" defaultValue={status} className={fieldClass}>
                    <option value="">Any</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Verified</label>
                  <select name="verified" defaultValue={verified} className={fieldClass}>
                    <option value="">Any</option>
                    <option value="true">Verified</option>
                    <option value="false">Not verified</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Page size</label>
                  <select name="limit" defaultValue={String(limit)} className={fieldClass}>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>
              <input type="hidden" name="page" value="1" />
              <div className="flex flex-wrap gap-3">
                <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Apply</button>
                <Link href="/dashboard/admin" className={secondaryButtonClass}>
                  Clear
                </Link>
              </div>
            </form>
          </div>
        </details>

        <div className="hidden md:block">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
              <p className="mt-1 text-sm text-slate-500">Search and narrow the provider list.</p>
            </div>
          </div>
          <form method="GET" className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,180px))_auto_auto] xl:items-end">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Search</label>
              <input type="text" name="query" placeholder="business, email, city, state..." defaultValue={query ?? ''} className={fieldClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select name="status" defaultValue={status} className={fieldClass}>
                <option value="">Any</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Verified</label>
              <select name="verified" defaultValue={verified} className={fieldClass}>
                <option value="">Any</option>
                <option value="true">Verified</option>
                <option value="false">Not verified</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Page size</label>
              <select name="limit" defaultValue={String(limit)} className={fieldClass}>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="50">50</option>
              </select>
            </div>
            <input type="hidden" name="page" value="1" />
            <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Apply</button>
            <Link href="/dashboard/admin" className={secondaryButtonClass}>
              Clear
            </Link>
          </form>
        </div>
      </section>

      <section className="mt-5 space-y-4">
        {rows.length === 0 ? (
          <div className={`${shellClass} text-center`}>
            <div className="text-slate-800 font-medium">No results</div>
            <div className="mt-1 text-sm text-slate-500">Try clearing filters or searching a different term.</div>
            <div className="mt-4">
              <Link href="/dashboard/admin" className={`inline-flex ${secondaryButtonClass}`}>
                Clear filters
              </Link>
            </div>
          </div>
        ) : (
          rows.map((p) => (
            <article key={p.id} className={shellClass}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/providers/${p.slug}`} className="text-lg font-semibold text-slate-950 hover:underline">
                        {p.businessName}
                      </Link>
                      <StatusBadge status={p.status} />
                      <VerifiedBadge verified={!!p.verified} />
                    </div>
                    <div className={`${mutedPanelClass} mt-3 grid gap-3 text-sm text-slate-700`}>
                      <div className="break-all">
                        <span className="mr-1 text-slate-500">Email:</span>
                        {p.email}
                      </div>
                      <div>
                        <span className="mr-1 text-slate-500">Location:</span>
                        {p.city}, {p.state}
                      </div>
                      {p.disabledReason ? (
                        <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 text-sm text-slate-600">
                          Disabled reason: {p.disabledReason}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:max-w-[260px] lg:justify-end">
                    <Link href={`/dashboard/admin/providers/${p.id}`} className="rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                      Edit
                    </Link>

                    {p.status === 'pending' ? (
                      <form action={approve}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                          Approve
                        </button>
                      </form>
                    ) : null}

                    <form action={toggleVerify}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="currentVerified" value={String(p.verified)} />
                      <button className="rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                        {p.verified ? 'Unverify' : 'Verify'}
                      </button>
                    </form>

                    {p.status === 'disabled' ? (
                      <form action={enableProvider}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                          Enable
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className={mutedPanelClass}>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Rating</div>
                    <div className="mt-2 text-xl font-semibold text-slate-950">{typeof p.rating === 'number' ? p.rating.toFixed(1) : '0.0'}</div>
                  </div>
                  <div className={mutedPanelClass}>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Created</div>
                    <div className="mt-2 text-sm font-medium text-slate-950">{new Date(p.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className={mutedPanelClass}>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Updated</div>
                    <div className="mt-2 text-sm font-medium text-slate-950">{new Date(p.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {p.status !== 'disabled' ? (
                  <div className={mutedPanelClass}>
                    <div className="text-sm font-semibold text-slate-900">Disable provider</div>
                    <p className="mt-1 text-sm text-slate-500">Disabling hides the listing from search. A reason is required.</p>
                    <form action={disableProvider} className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="text"
                        name="reason"
                        placeholder="Reason (required)"
                        className="min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200/70"
                        required
                        minLength={2}
                      />
                      <button className="rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                        Disable
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>

      <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.92))] px-5 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">Showing {start}-{end} of {meta.total}</div>

        <div className="flex items-center gap-2">
          <Link
            aria-disabled={meta.page <= 1}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${meta.page <= 1 ? 'pointer-events-none border-slate-200/80 bg-slate-100 text-slate-400' : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
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

          <span className="text-sm text-slate-600">
            Page {meta.page} / {meta.totalPages}
          </span>

          <Link
            aria-disabled={meta.page >= meta.totalPages}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${meta.page >= meta.totalPages ? 'pointer-events-none border-slate-200/80 bg-slate-100 text-slate-400' : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
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

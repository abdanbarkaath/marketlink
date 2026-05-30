import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { formatServiceTokenLabel, getMarketingSubjectById } from '@/lib/marketingTaxonomy';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type SummaryResponse = {
  user?: { email?: string; role?: 'provider' | 'customer' | 'admin' };
  customer?: { name?: string | null; businessName?: string | null } | null;
};

type RequestHistoryItem = {
  id: string;
  title: string;
  marketingSubjectId: string;
  serviceTokens: string[];
  zip: string;
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
};

type RequestsResponse = {
  ok?: boolean;
  data?: RequestHistoryItem[];
};

function formatRequestStatus(status: RequestHistoryItem['status']) {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'CLOSED') return 'Closed';
  return 'Cancelled';
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function CustomerRequestsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  const cookieHeader = sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : '';

  const summaryRes = await fetch(`${API_BASE}/me/summary`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: 'no-store',
  });

  if (summaryRes.status === 401) {
    redirect('/login?returnTo=/dashboard/customer/requests');
  }

  if (!summaryRes.ok) {
    throw new Error(`Failed to load customer account (${summaryRes.status})`);
  }

  const summary = (await summaryRes.json()) as SummaryResponse;

  if (summary.user?.role === 'admin') redirect('/dashboard/admin');
  if (summary.user?.role === 'provider') redirect('/dashboard');
  if (!(summary.customer?.name || '').trim()) redirect('/dashboard/customer/onboarding');

  const requestsRes = await fetch(`${API_BASE}/requests`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: 'no-store',
  });

  if (!requestsRes.ok) {
    throw new Error(`Failed to load customer requests (${requestsRes.status})`);
  }

  const requestsData = (await requestsRes.json()) as RequestsResponse;
  const requests = requestsData.data || [];

  return (
    <main className="ml-page-bg min-h-[calc(100vh-72px)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Customer requests</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Request history</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Create requests privately, then revisit the matching preview and request details here.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard/customer" className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900">
              Back to dashboard
            </Link>
            <Link href="/dashboard/customer/requests/new" className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white">
              Create request
            </Link>
          </div>
        </div>

        {requests.length === 0 ? (
          <section className="ml-card mt-5 rounded-[28px] p-6 shadow-[0_18px_50px_rgba(23,26,31,0.06)]">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">No requests yet</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Start with your first request</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Once you describe what you need, MarketLink will show a private matching preview based on service tags and the MVP locality rules.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/customer/requests/new" className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white">
                Create request
              </Link>
              <Link href="/experts" className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900">
                Browse experts
              </Link>
            </div>
          </section>
        ) : (
          <section className="mt-5 grid gap-4">
            {requests.map((request) => {
              const subject = getMarketingSubjectById(request.marketingSubjectId);
              return (
                <Link
                  key={request.id}
                  href={`/dashboard/customer/requests/view?id=${encodeURIComponent(request.id)}`}
                  className="ml-card rounded-[24px] p-5 shadow-[0_18px_44px_rgba(23,26,31,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(23,26,31,0.08)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                          {formatRequestStatus(request.status)}
                        </span>
                        <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                          {subject?.label || request.marketingSubjectId}
                        </span>
                      </div>
                      <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{request.title}</h2>
                      <p className="mt-2 text-sm text-slate-600">
                        Created {formatShortDate(request.createdAt)} • ZIP {request.zip}
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-slate-900">Open</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {request.serviceTokens.slice(0, 4).map((token) => (
                      <span
                        key={token}
                        className="inline-flex rounded-xl bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                      >
                        {formatServiceTokenLabel(token)}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

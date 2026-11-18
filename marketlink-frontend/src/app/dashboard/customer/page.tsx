import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerApiHeaders } from '@/lib/serverApi';
import DashboardMetric from '../DashboardMetric';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type SummaryResponse = {
  user?: { email?: string; role?: 'provider' | 'customer' | 'admin' };
  customer?: { name?: string | null; businessName?: string | null } | null;
  customerStats?: {
    activeRequestCount?: number;
    pendingProposalCount?: number;
    conversationCount?: number;
  } | null;
};

export default async function CustomerDashboardPage() {
  const requestHeaders = await getServerApiHeaders();

  const res = await fetch(`${API_BASE}/me/summary`, {
    headers: requestHeaders,
    cache: 'no-store',
  });

  if (res.status === 401) {
    redirect('/login?returnTo=/dashboard/customer');
  }

  if (!res.ok) {
    throw new Error(`Failed to load customer account gate (${res.status})`);
  }

  const data = (await res.json()) as SummaryResponse;

  if (data.user?.role === 'admin') {
    redirect('/dashboard/admin');
  }

  if (data.user?.role === 'provider') {
    redirect('/dashboard');
  }

  const name = (data.customer?.name || '').trim();
  const businessName = (data.customer?.businessName || '').trim();
  const email = (data.user?.email || '').trim();

  if (!name) {
    redirect('/dashboard/customer/onboarding');
  }

  const activeRequestCount = data.customerStats?.activeRequestCount ?? null;
  const pendingProposalCount = data.customerStats?.pendingProposalCount ?? null;
  const conversationCount = data.customerStats?.conversationCount ?? null;

  return (
    <main className="ml-page-bg min-h-[calc(100vh-72px)]">
      <div className="dashboard-page-content mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="dashboard-intro flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Good to see you, {name}.</h1>
            <p className="dashboard-intro-copy mt-2 max-w-2xl text-sm leading-6">
              Find local experts, track your requests, and review proposals.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/customer/requests/new" className="ml-btn-primary inline-flex items-center justify-center px-5 py-3 text-sm font-semibold">
              Create request
            </Link>
            <Link href="/experts" className="ml-btn-secondary inline-flex items-center justify-center px-5 py-3 text-sm font-semibold">
              Browse experts
            </Link>
          </div>
        </section>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="ml-card rounded-xl p-5 sm:p-6">
            <h2 className="text-xl font-bold text-[#192a48]">Your activity</h2>
            <div className="mt-3 grid divide-y divide-slate-200 border-t border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <DashboardMetric
                title="Active requests"
                value={activeRequestCount}
                detail="View request history"
                href="/dashboard/customer/requests"
              />
              <DashboardMetric
                title="Proposals to review"
                value={pendingProposalCount}
                detail="Review provider responses"
                href="/dashboard/customer/proposals"
              />
              <DashboardMetric
                title="Conversations"
                value={conversationCount}
                detail="Open messages"
                href="/dashboard/customer/messages"
              />
            </div>
          </section>

          <aside className="ml-card rounded-xl p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#192a48]">Account</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-slate-600">Email</dt>
                <dd className="mt-1 break-all text-slate-900">{email}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-600">Business</dt>
                <dd className="mt-1 text-slate-900">{businessName || 'Optional for now'}</dd>
              </div>
            </dl>
            <Link href="/dashboard/customer/profile" className="ml-btn-secondary mt-4 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold">
              Edit profile
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}

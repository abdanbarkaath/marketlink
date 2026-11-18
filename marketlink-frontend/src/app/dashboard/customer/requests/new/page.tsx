import { redirect } from 'next/navigation';
import Link from 'next/link';
import CustomerRequestForm from '../CustomerRequestForm';
import { getServerApiHeaders } from '@/lib/serverApi';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type SummaryResponse = {
  user?: { email?: string; role?: 'provider' | 'customer' | 'admin' };
  customer?: { name?: string | null; businessName?: string | null } | null;
};

export default async function CustomerNewRequestPage() {
  const requestHeaders = await getServerApiHeaders();

  const res = await fetch(`${API_BASE}/me/summary`, {
    headers: requestHeaders,
    cache: 'no-store',
  });

  if (res.status === 401) {
    redirect('/login?returnTo=/dashboard/customer/requests/new');
  }

  if (!res.ok) {
    throw new Error(`Failed to load customer account (${res.status})`);
  }

  const data = (await res.json()) as SummaryResponse;

  if (data.user?.role === 'admin') redirect('/dashboard/admin');
  if (data.user?.role === 'provider') redirect('/dashboard');
  if (!(data.customer?.name || '').trim()) redirect('/dashboard/customer/onboarding');

  return (
    <main className="ml-page-bg min-h-[calc(100vh-72px)]">
      <div className="dashboard-page-content mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="dashboard-intro p-5 sm:p-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Create a request</h1>
          <p className="dashboard-intro-copy mt-3 max-w-2xl text-sm leading-6">
            Choose a marketing area if you know what you need, or start with your ZIP code to find nearby help.
          </p>
        </header>
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_300px]">
          <section aria-label="Request details" className="ml-card min-w-0 rounded-xl p-5 sm:p-6">
            <CustomerRequestForm />
          </section>

          <aside className="ml-card rounded-xl p-5 sm:p-6 lg:sticky lg:top-6 lg:self-start">
            <h2 className="text-lg font-bold text-slate-950">How requests work</h2>
            <div className="mt-4 grid gap-3">
              <div className="border-b border-slate-200 pb-3">
                <div className="text-sm font-semibold text-slate-900">Private by default</div>
                <p className="mt-1 text-sm leading-6 text-slate-600">Requests stay inside your customer dashboard. Nothing here becomes a public marketplace page.</p>
              </div>
              <div className="ml-surface-muted rounded-2xl p-4">
                <div className="text-sm font-semibold text-slate-900">Two ways to start</div>
                <p className="mt-1 text-sm leading-6 text-slate-600">Use the specific path when you know the marketing area. Use the unsure path when you just want nearby help without picking a category first.</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <Link href="/dashboard/customer/requests" className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900">
                View request history
              </Link>
              <Link href="/experts" className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900">
                Browse experts first
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CustomerRequestForm from '../CustomerRequestForm';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type SummaryResponse = {
  user?: { email?: string; role?: 'provider' | 'customer' | 'admin' };
  customer?: { name?: string | null; businessName?: string | null } | null;
};

export default async function CustomerNewRequestPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  const cookieHeader = sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : '';

  const res = await fetch(`${API_BASE}/me/summary`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
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
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_320px]">
          <section className="ml-card overflow-hidden rounded-[28px] p-5 shadow-[0_18px_50px_rgba(23,26,31,0.06)] sm:p-6">
            <div className="h-1.5 bg-[linear-gradient(90deg,#0f172a,#25324a,#b6bdc8)] -mx-5 -mt-5 mb-5 sm:-mx-6 sm:-mt-6 sm:mb-6" />
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Customer requests</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Create a request</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Keep this simple. If you know the kind of help you want, choose it. If not, start broad with your ZIP code and radius, and keep the request easy to understand.
              </p>
            </div>

            <div className="mt-6">
              <CustomerRequestForm />
            </div>
          </section>

          <aside className="ml-card rounded-[28px] p-5 shadow-[0_18px_50px_rgba(23,26,31,0.06)] sm:p-6 lg:sticky lg:top-6 lg:self-start">
            <div className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">How this works</div>
            <div className="mt-4 grid gap-3">
              <div className="ml-surface-muted rounded-2xl p-4">
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

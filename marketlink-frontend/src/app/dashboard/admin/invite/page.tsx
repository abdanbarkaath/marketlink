import { headers } from 'next/headers';
import Link from 'next/link';
import InviteUserForm from '@/components/admin/InviteUserForm';

export const dynamic = 'force-dynamic';

export default async function AdminInvitePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const cookie = headers().get('cookie') || '';

  const statsRes = await fetch(`${apiBase}/admin/stats`, {
    cache: 'no-store',
    headers: { 'content-type': 'application/json', cookie },
  });

  if (statsRes.status === 401 || statsRes.status === 403) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-semibold text-slate-950">Admin invite</h1>
        <p className="mt-2 text-red-600">You are not authorized to view this page.</p>
      </main>
    );
  }

  if (!statsRes.ok) {
    const txt = await statsRes.text();
    return (
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-semibold text-slate-950">Admin invite</h1>
        <p className="mt-2 text-red-600">Failed to load admin guard.</p>
        <pre className="mt-4 overflow-auto rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-xs">{txt}</pre>
      </main>
    );
  }

  const shellClass =
    'rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(236,242,248,0.96))] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6';
  const mutedPanelClass =
    'rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]';
  const subtlePillClass = 'rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm';

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <section className={`${shellClass} overflow-hidden`}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_280px] lg:items-stretch">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Admin access</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Invite user</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Create a provider or admin account, send a temporary password, and hand off access without touching the database.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className={subtlePillClass}>Fast account creation</span>
              <span className={subtlePillClass}>Temporary password flow</span>
              <span className={subtlePillClass}>Admin-safe onboarding</span>
            </div>
          </div>

          <div className={`${mutedPanelClass} flex flex-col justify-between`}>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Quick context</div>
              <div className="mt-3 rounded-2xl bg-slate-900 px-4 py-4 text-white shadow-[0_18px_34px_rgba(15,23,42,0.18)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Access handoff</div>
                <p className="mt-2 text-sm leading-6 text-slate-200">Use this flow when a provider needs first-time access without manual database work.</p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/dashboard/admin" className="inline-flex w-full items-center justify-center rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                Back to admin
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_320px] lg:items-start">
        <section className={`${shellClass} order-1`}>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-slate-900">New user invite</h2>
            <p className="text-sm text-slate-500">The invite form stays first on mobile so the main action is immediately available.</p>
          </div>

          <div className="mt-5">
            <InviteUserForm />
          </div>
        </section>

        <aside className={`${shellClass} order-2 lg:sticky lg:top-6`}>
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Invite notes</div>
          <div className="mt-4 grid gap-3">
            <div className={mutedPanelClass}>
              <div className="text-sm font-semibold text-slate-900">Temp password</div>
              <p className="mt-1 text-sm text-slate-600">The backend generates a temporary password and marks the user to change it on first sign-in.</p>
            </div>
            <div className={mutedPanelClass}>
              <div className="text-sm font-semibold text-slate-900">Provider vs admin</div>
              <p className="mt-1 text-sm text-slate-600">Use provider for marketplace owners. Only invite admin when platform access is actually needed.</p>
            </div>
            <div className={mutedPanelClass}>
              <div className="text-sm font-semibold text-slate-900">Next step</div>
              <p className="mt-1 text-sm text-slate-600">After the invite is sent, the user can sign in and complete onboarding or manage listings immediately.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

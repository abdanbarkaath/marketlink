import { headers } from 'next/headers';
import InviteUserForm from '@/components/admin/InviteUserForm';

export const dynamic = 'force-dynamic';

export default async function AdminInvitePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const requestHeaders = await headers();
  const cookie = requestHeaders.get('cookie') || '';

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

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="dashboard-intro flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Invite user</h1>
          <p className="dashboard-intro-copy mt-2 text-sm leading-6">
            Create a provider or admin account with a temporary password.
          </p>
        </div>
      </section>

      <div className="mt-5 grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
        <section className="ml-card rounded-xl p-5 sm:p-6" aria-label="Invite details">
          <InviteUserForm />
        </section>

        <aside className="ml-surface-muted rounded-xl p-5">
          <h2 className="text-base font-bold text-[#192a48]">Before you invite</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Use the provider role for marketplace experts. Give admin access only to users who need to manage the platform.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            The invited user should change their temporary password on first sign-in.
          </p>
        </aside>
      </div>
    </main>
  );
}

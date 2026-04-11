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
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Admin Invite</h1>
        <p className="text-red-600">You are not authorized to view this page.</p>
      </main>
    );
  }

  if (!statsRes.ok) {
    const txt = await statsRes.text();
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Admin Invite</h1>
        <p className="text-red-600">Failed to load admin guard.</p>
        <pre className="mt-3 rounded border bg-gray-50 p-3 text-xs overflow-auto">{txt}</pre>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invite User</h1>
          <p className="text-sm text-gray-500">Create a user and send a temp password.</p>
        </div>
        <Link href="/dashboard/admin" className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
          Back to admin
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <InviteUserForm />
      </div>
    </main>
  );
}

import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch } from '../../lib/serverApi';

type MeResponse = {
  ok: boolean;
  user: { id: string; email: string; role: 'admin' | 'provider' };
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Check auth (forwards session cookie) and gate by role
  const res = await apiFetch('/auth/me');
  if (res.status === 401) {
    redirect('/login');
  }
  const data = (await res.json()) as MeResponse;
  if (data?.user?.role !== 'admin') {
    redirect('/'); // not an admin
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="font-semibold">MarketLink · Admin</div>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="hover:underline">
              Overview
            </Link>
            <Link href="/admin/providers" className="hover:underline">
              Providers
            </Link>
            <Link href="/admin/stats" className="hover:underline">
              Stats
            </Link>
          </nav>
        </div>
      </aside>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

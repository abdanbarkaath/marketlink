'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Role = 'provider' | 'admin' | '' | null | string;

export default function AppHeader() {
  const pathname = usePathname();
  const [role, setRole] = useState<Role>(null); // null = unknown/loading, '' = not authed

  useEffect(() => {
    let alive = true;
    setRole(null); // show skeleton while checking

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/me/summary`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!alive) return;

        if (res.status === 401) {
          setRole('');
          return;
        }

        if (!res.ok) {
          setRole('');
          return;
        }

        const data = await res.json().catch(() => ({} as any));
        const r = String(data?.user?.role || '');
        setRole(r);
      } catch {
        if (!alive) return;
        setRole('');
      }
    })();

    return () => {
      alive = false;
    };
  }, [pathname]); // ✅ rerun on navigation

  const canSeeDashboard = role === 'provider' || role === 'admin';

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold">
          MarketLink
        </Link>

        <div className="flex items-center gap-2">
          {role === null ? (
            <div className="h-9 w-24 rounded-xl border opacity-50" aria-hidden="true" />
          ) : canSeeDashboard ? (
            <>
              <Link href="/dashboard" className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50">
                Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

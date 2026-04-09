'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import ThemeToggle, { useMarketLinkTheme } from '@/components/ThemeToggle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Role = 'provider' | 'admin' | '' | null | string;

export default function AppHeader() {
  const pathname = usePathname();
  const [role, setRole] = useState<Role>(null);
  const { t } = useMarketLinkTheme();

  useEffect(() => {
    let alive = true;
    setRole(null);

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
  }, [pathname]);

  const canSeeDashboard = role === 'provider' || role === 'admin';

  return (
    <header className={`sticky top-0 z-50 border-b ${t.header} backdrop-blur`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-slate-900">
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${t.brandBadge} shadow-sm`}>M</span>
          <span className="text-base sm:text-lg">MarketLink</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle compact />

          {role === null ? (
            <div className="h-9 w-20 sm:w-24 rounded-xl border border-slate-200/70 bg-white/60 opacity-60" aria-hidden="true" />
          ) : canSeeDashboard ? (
            <>
              <Link href="/dashboard" className={`h-9 rounded-xl px-3 flex items-center text-sm font-semibold ${t.secondaryBtn}`}>
                Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className={`h-9 rounded-xl px-3 flex items-center text-sm font-semibold ${t.secondaryBtn}`}>
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Role = 'provider' | 'customer' | 'admin' | '' | null | string;
type NavItem = {
  href: string;
  label: string;
  active: boolean;
};

function canAccessDashboard(role: Role) {
  return role === 'provider' || role === 'customer' || role === 'admin';
}

function getDashboardHref(role: Role) {
  if (role === 'admin') return '/dashboard/admin';
  if (role === 'customer') return '/dashboard/customer';
  return '/dashboard';
}

export default function AppHeader() {
  const pathname = usePathname();
  const [role, setRole] = useState<Role>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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

        const data: { user?: { role?: unknown } } = await res.json().catch(() => ({}));
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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const canSeeDashboard = canAccessDashboard(role);
  const dashboardHref = getDashboardHref(role);
  const isHomePage = pathname === '/';
  const isProvidersPage = pathname?.startsWith('/providers') || pathname?.startsWith('/experts');
  const isLoginPage = pathname === '/login';
  const isDashboardPage = pathname?.startsWith('/dashboard');
  const showLoginAction = !canSeeDashboard && !isLoginPage;
  const navItems: NavItem[] = [
    { href: '/', label: 'Home', active: isHomePage },
    { href: '/experts', label: 'Browse experts', active: Boolean(isProvidersPage) },
    ...(canSeeDashboard ? [{ href: dashboardHref, label: 'Dashboard', active: Boolean(isDashboardPage) }] : []),
  ];
  const mobileMenuBaseClass = 'flex min-h-[4.65rem] items-center justify-between border-t border-slate-200/80 px-7 text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-950 transition active:bg-orange-50/40';
  const mobileMenuRowClass = mobileMenuBaseClass;
  const mobileMenuActiveClass = `${mobileMenuBaseClass} bg-orange-50/45`;
  const desktopNavShellClass =
    'hidden lg:flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/86 px-2 py-1.5 shadow-[0_20px_46px_rgba(18,26,42,0.08)] backdrop-blur';
  const desktopLinkClass =
    'inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-950';
  const desktopActiveLinkClass = 'inline-flex items-center rounded-full bg-[#1f314d] px-4 py-2 text-sm font-medium text-white shadow-[0_12px_26px_rgba(31,49,77,0.18)]';
  const actionButtonClass = 'ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold shadow-sm transition';
  const mobileMenuButtonClass = 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-950 shadow-sm transition lg:hidden';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/75 bg-white/78 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:hidden">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-slate-950">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1.1rem] bg-[#1f314d] text-sm font-semibold text-white shadow-[0_12px_22px_rgba(31,49,77,0.22)]">
            ML
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-semibold tracking-[-0.04em]">MarketLink</span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">Local growth marketplace</span>
          </span>
        </Link>

        <button
          type="button"
          className={mobileMenuButtonClass}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMobileOpen((value) => !value)}
        >
          <span className="relative block h-5 w-5 shrink-0">
            {mobileOpen ? (
              <>
                <span className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rotate-45 bg-current" />
                <span className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 -rotate-45 bg-current" />
              </>
            ) : (
              <>
                <span className="absolute left-0 top-0.5 h-0.5 w-5 bg-current" />
                <span className="absolute left-0 top-[9px] h-0.5 w-5 bg-current" />
                <span className="absolute left-0 top-[17px] h-0.5 w-5 bg-current" />
              </>
            )}
          </span>
        </button>
      </div>

      <div className="mx-auto hidden max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:flex">
        <Link href="/" className="flex min-w-0 items-center gap-4 text-slate-950">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.35rem] bg-[#1f314d] text-sm font-semibold text-white shadow-[0_16px_32px_rgba(31,49,77,0.25)]">
            ML
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-medium uppercase tracking-[0.32em] text-slate-500">Local Growth Marketplace</span>
            <span className="block truncate text-xl font-semibold tracking-tight sm:text-[1.4rem]">MarketLink</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="ml-glass-note hidden rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 xl:inline-flex">
            Search nearby. Compare clearly. Hire locally.
          </div>

          <nav className={desktopNavShellClass}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={item.active ? desktopActiveLinkClass : desktopLinkClass}>
                {item.label}
              </Link>
            ))}
          </nav>

          {role === null ? (
            <div className="h-11 w-28 rounded-full border border-slate-200 bg-slate-100 opacity-60" aria-hidden="true" />
          ) : canSeeDashboard ? (
            <LogoutButton className={actionButtonClass} />
          ) : showLoginAction ? (
            <Link href="/login" className={actionButtonClass}>
              Sign in
            </Link>
          ) : null}
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-x-0 top-[69px] z-[60] h-[calc(100vh-69px)] bg-white/38 px-5 pt-5 backdrop-blur-lg sm:px-10 lg:hidden">
          <div
            data-testid="mobile-navigation-menu"
            className="overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-white text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
          >
            <div>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={item.active ? mobileMenuActiveClass : mobileMenuRowClass}
                >
                  <span>{item.label}</span>
                  <span className="text-2xl leading-none text-current/75" aria-hidden="true">&rsaquo;</span>
                </Link>
              ))}

              {role === null ? (
                <div className="min-h-[4.5rem] border-t border-slate-200 bg-slate-50" aria-hidden="true" />
              ) : canSeeDashboard ? (
              <>
                <LogoutButton className={`${mobileMenuRowClass} w-full`} />
              </>
            ) : showLoginAction ? (
              <Link
                href="/login"
                className={mobileMenuRowClass}
              >
                <span>Sign in</span>
                <span className="text-2xl leading-none text-current/75" aria-hidden="true">&rsaquo;</span>
              </Link>
            ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

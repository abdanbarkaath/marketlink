'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import { useMarketLinkTheme } from '@/components/ThemeToggle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Role = 'provider' | 'admin' | '' | null | string;
type NavItem = {
  href: string;
  label: string;
  active: boolean;
};

function canAccessDashboard(role: Role) {
  return role === 'provider' || role === 'admin';
}

function getDashboardHref(role: Role) {
  return role === 'admin' ? '/dashboard/admin' : '/dashboard';
}

export default function AppHeader() {
  const pathname = usePathname();
  const [role, setRole] = useState<Role>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
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
  const mobileMenuBaseClass = 'flex min-h-[4.65rem] items-center justify-between border-t border-slate-200 px-8 text-[1.35rem] font-semibold tracking-[-0.02em] text-slate-950 transition active:bg-slate-50';
  const mobileMenuRowClass = mobileMenuBaseClass;
  const mobileMenuActiveClass = `${mobileMenuBaseClass} bg-slate-50`;
  const desktopNavShellClass =
    'hidden lg:flex items-center gap-1 rounded-[1.35rem] border border-slate-200 bg-white/85 px-2 py-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur';
  const desktopLinkClass =
    'inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950';
  const desktopActiveLinkClass = 'inline-flex items-center rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-950';
  const actionButtonClass = `inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium shadow-sm transition ${t.secondaryBtn}`;
  const mobileMenuButtonClass = 'inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm transition lg:hidden';

  return (
    <header className="sticky top-0 z-50 relative border-b border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:hidden">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-slate-950">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white shadow-sm">
            M
          </span>
          <span className="block truncate text-xl font-semibold tracking-[-0.04em]">MarketLink</span>
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

      <div className="mx-auto hidden max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:flex">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-slate-950">
          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${t.brandBadge} shadow-[0_16px_36px_rgba(15,23,42,0.18)]`}>
            M
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-medium uppercase tracking-[0.32em] text-slate-400">Local Growth Marketplace</span>
            <span className="block truncate text-lg font-semibold tracking-tight sm:text-xl">MarketLink</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <nav className={desktopNavShellClass}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={item.active ? desktopActiveLinkClass : desktopLinkClass}>
                {item.label}
              </Link>
            ))}
          </nav>

          {role === null ? (
            <div className="h-11 w-28 rounded-xl border border-slate-200 bg-slate-100 opacity-60" aria-hidden="true" />
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
        <div className="fixed inset-x-0 top-[69px] z-[60] h-[calc(100vh-69px)] bg-white/40 px-5 pt-5 backdrop-blur-lg sm:px-10 lg:hidden">
          <div
            data-testid="mobile-navigation-menu"
            className="overflow-hidden border border-slate-200 bg-white text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
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

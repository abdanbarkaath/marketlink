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
  const isProvidersPage = pathname?.startsWith('/providers');
  const isLoginPage = pathname === '/login';
  const isDashboardPage = pathname?.startsWith('/dashboard');
  const showLoginAction = !canSeeDashboard && !isLoginPage;
  const navItems: NavItem[] = [
    { href: '/', label: 'Home', active: isHomePage },
    { href: '/providers', label: 'Browse experts', active: Boolean(isProvidersPage) },
    ...(canSeeDashboard ? [{ href: dashboardHref, label: 'Dashboard', active: Boolean(isDashboardPage) }] : []),
  ];
  const mobileMenuBaseClass = 'inline-flex min-h-12 items-center justify-between rounded-xl border px-4 text-sm font-medium transition';
  const mobileMenuRowClass = `${mobileMenuBaseClass} ${t.secondaryBtn}`;
  const mobileMenuActiveClass = `${mobileMenuBaseClass} ml-btn-primary border-transparent text-white`;
  const desktopNavShellClass =
    'hidden lg:flex items-center gap-1 rounded-[1.35rem] border border-white/14 bg-white/10 px-2 py-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur';
  const desktopLinkClass =
    'inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium transition text-[rgb(var(--ml-header-muted))] hover:bg-white/10 hover:text-[rgb(var(--ml-header-text))]';
  const desktopActiveLinkClass = 'inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium bg-white/14 text-[rgb(var(--ml-header-text))]';
  const actionButtonClass = `inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium shadow-sm transition ${t.secondaryBtn}`;
  const mobileMenuButtonClass = `inline-flex h-11 w-11 items-center justify-center rounded-xl border text-current shadow-sm transition lg:hidden ${t.secondaryBtn} ${t.headerText}`;

  return (
    <header className={`sticky top-0 z-50 border-b ${t.header} relative shadow-[0_12px_30px_rgba(15,23,42,0.05)]`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className={`flex min-w-0 items-center gap-3 ${t.headerText}`}>
          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${t.brandBadge} shadow-[0_16px_36px_rgba(15,23,42,0.18)]`}>
            M
          </span>
          <span className="min-w-0">
            <span className={`block text-[11px] font-medium uppercase tracking-[0.32em] ${t.headerMutedText}`}>Local Growth Marketplace</span>
            <span className="block truncate text-lg font-semibold tracking-tight sm:text-xl">MarketLink</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3">
            <nav className={desktopNavShellClass}>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={item.active ? desktopActiveLinkClass : desktopLinkClass}>
                  {item.label}
                </Link>
              ))}
            </nav>

            {role === null ? (
              <div className="h-11 w-28 rounded-xl border border-white/10 bg-white/8 opacity-60" aria-hidden="true" />
            ) : canSeeDashboard ? (
              <LogoutButton className={actionButtonClass} />
            ) : showLoginAction ? (
              <Link href="/login" className={actionButtonClass}>
                Login
              </Link>
            ) : null}
          </div>

          <button
            type="button"
            className={mobileMenuButtonClass}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileOpen((value) => !value)}
          >
            <span className="relative block h-4 w-4 shrink-0">
              <span className={`absolute left-0 top-0 h-0.5 w-4 bg-current transition ${mobileOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
              <span className={`absolute left-0 top-[7px] h-0.5 w-4 bg-current transition ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`absolute left-0 top-[14px] h-0.5 w-4 bg-current transition ${mobileOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
            </span>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="pointer-events-none absolute inset-x-0 top-full px-4 pt-3 sm:px-6 lg:hidden">
          <div className={`pointer-events-auto ml-auto w-full max-w-[22rem] overflow-hidden rounded-[1.5rem] border shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur ${t.header}`}>
            <div className="border-b border-white/10 px-5 py-4">
              <div className={`text-[11px] font-medium uppercase tracking-[0.26em] ${t.headerMutedText}`}>Navigate</div>
            </div>
            <div className="flex flex-col gap-3 px-4 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={item.active ? mobileMenuActiveClass : mobileMenuRowClass}
                >
                  <span>{item.label}</span>
                  <span className="text-base leading-none text-current/55" aria-hidden="true">&rarr;</span>
                </Link>
              ))}

              {role === null ? (
                <div className="h-12 rounded-xl border border-white/10 bg-white/8 opacity-60" aria-hidden="true" />
              ) : canSeeDashboard ? (
              <>
                <LogoutButton className={`${mobileMenuRowClass} justify-center`} />
              </>
            ) : showLoginAction ? (
              <Link
                href="/login"
                className={mobileMenuRowClass}
              >
                <span>Login</span>
                <span className="text-base leading-none text-current/55" aria-hidden="true">&rarr;</span>
              </Link>
            ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

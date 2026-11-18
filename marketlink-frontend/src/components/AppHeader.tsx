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

  const canSeeDashboard = canAccessDashboard(role);
  const dashboardHref = getDashboardHref(role);
  const isHomePage = pathname === '/';
  const isProvidersPage = pathname?.startsWith('/providers') || pathname?.startsWith('/experts');
  const isLoginPage = pathname === '/login';
  const showHomeLink = !isHomePage && !isLoginPage && pathname !== '/signup';
  const isDashboardPage = pathname?.startsWith('/dashboard');
  const showLoginAction = !canSeeDashboard && !isLoginPage;
  const navItems: NavItem[] = [
    ...(showHomeLink ? [{ href: '/', label: 'Home', active: false }] : []),
    { href: '/experts', label: 'Browse experts', active: Boolean(isProvidersPage) },
    ...(canSeeDashboard ? [{ href: dashboardHref, label: 'Dashboard', active: Boolean(isDashboardPage) }] : []),
    ...(isHomePage && !canSeeDashboard ? [{ href: '/signup', label: 'For agencies', active: false }] : []),
  ];

  return (
    <header className="approved-home home-preview-header">
      <div className="wrap nav">
        <Link href="/" aria-label="MarketLink home" aria-current={isHomePage ? 'page' : undefined} className="brand">
          <span className="mark" aria-hidden="true">ML</span>MarketLink
        </Link>
        <nav aria-label="Main navigation" className="home-preview-nav">
          {navItems.map(item => <Link key={item.href} href={item.href} aria-current={item.active ? 'page' : undefined}>{item.label}</Link>)}
          <div className="home-preview-account">
            {role === null ? <span className="inline-block h-11 w-16" aria-hidden="true" /> : canSeeDashboard ? <LogoutButton className="signin" /> : showLoginAction ? <Link href="/login" className="signin">Sign in</Link> : null}
          </div>
        </nav>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const expertLinks = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/requests', label: 'Matched requests' },
  { href: '/dashboard/inquiries', label: 'Buyer inquiries' },
  { href: '/dashboard/messages', label: 'Conversations' },
];

const customerLinks = [
  { href: '/dashboard/customer', label: 'Overview' },
  { href: '/dashboard/customer/requests', label: 'Requests' },
  { href: '/dashboard/customer/proposals', label: 'Proposals' },
  { href: '/dashboard/customer/messages', label: 'Conversations' },
  { href: '/dashboard/customer/profile', label: 'Edit profile' },
];

const adminLinks = [
  { href: '/dashboard/admin', label: 'Overview' },
  { href: '/dashboard/admin/invite', label: 'Invite user' },
];

function isWithin(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export default function DashboardWorkspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const links = isWithin(pathname, '/dashboard/admin')
    ? adminLinks
    : isWithin(pathname, '/dashboard/customer')
      ? customerLinks
      : expertLinks;

  if (['/dashboard/profile', '/dashboard/onboarding', '/dashboard/customer/onboarding'].includes(pathname)) {
    return children;
  }

  const active = links.find(({ href }) => href !== links[0].href && isWithin(pathname, href)) ?? links[0];

  return (
    <div className="dashboard-shell">
      <nav aria-label="Dashboard sections" className="dashboard-sidebar">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={href === active.href ? (href === pathname ? 'page' : 'location') : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="dashboard-pane">{children}</div>
    </div>
  );
}

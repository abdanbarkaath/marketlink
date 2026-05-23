import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type SummaryResponse = {
  user?: { role?: 'provider' | 'customer' | 'admin' };
  customer?: { name?: string | null } | null;
};

export default async function CustomerDashboardGatePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  const cookieHeader = sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : '';

  const res = await fetch(`${API_BASE}/me/summary`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: 'no-store',
  });

  if (res.status === 401) {
    redirect('/login?returnTo=/dashboard/customer');
  }

  if (!res.ok) {
    throw new Error(`Failed to load customer account gate (${res.status})`);
  }

  const data = (await res.json()) as SummaryResponse;

  if (data.user?.role === 'admin') {
    redirect('/dashboard/admin');
  }

  if (data.user?.role === 'provider') {
    redirect('/dashboard');
  }

  if ((data.customer?.name || '').trim()) {
    redirect('/dashboard/customer/profile');
  }

  redirect('/dashboard/customer/onboarding');
}

import { redirect } from 'next/navigation';
import CustomerProfileForm from '../CustomerProfileForm';
import { getServerApiHeaders } from '@/lib/serverApi';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type SummaryResponse = {
  user?: { email?: string; role?: 'provider' | 'customer' | 'admin' };
  customer?: { name?: string | null; businessName?: string | null } | null;
};

export default async function CustomerOnboardingPage() {
  const requestHeaders = await getServerApiHeaders();

  const res = await fetch(`${API_BASE}/me/summary`, {
    headers: requestHeaders,
    cache: 'no-store',
  });

  if (res.status === 401) {
    redirect('/login?returnTo=/dashboard/customer/onboarding');
  }

  if (!res.ok) {
    throw new Error(`Failed to load customer onboarding (${res.status})`);
  }

  const data = (await res.json()) as SummaryResponse;

  if (data.user?.role === 'admin') {
    redirect('/dashboard/admin');
  }

  if (data.user?.role === 'provider') {
    redirect('/dashboard');
  }

  if ((data.customer?.name || '').trim()) {
    redirect('/dashboard/customer');
  }

  return (
    <CustomerProfileForm
      mode="onboarding"
      email={data.user?.email || ''}
      initialName={data.customer?.name || ''}
      initialBusinessName={data.customer?.businessName || ''}
    />
  );
}

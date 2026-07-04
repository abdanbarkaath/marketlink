import { redirect } from 'next/navigation';
import OnboardingForm from './OnboardingForm';
import { getServerApiHeaders } from '@/lib/serverApi';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type SummaryResponse = {
  user?: { role?: 'provider' | 'customer' | 'admin' };
  expert?: { id: string } | null;
  provider?: { id: string } | null;
};

export default async function OnboardingPage() {
  const requestHeaders = await getServerApiHeaders();

  const res = await fetch(`${API_BASE}/me/summary`, {
    headers: requestHeaders,
    cache: 'no-store',
  });

  if (res.status === 401) {
    redirect('/login?returnTo=/dashboard/onboarding');
  }

  if (!res.ok) {
    throw new Error(`Failed to load onboarding gate (${res.status})`);
  }

  const data = (await res.json()) as SummaryResponse;

  if (data.user?.role === 'customer') {
    redirect('/dashboard/customer');
  }

  if (data.user?.role === 'admin') {
    redirect('/dashboard/admin');
  }

  if (data.expert || data.provider) {
    redirect('/dashboard/profile');
  }

  return <OnboardingForm />;
}

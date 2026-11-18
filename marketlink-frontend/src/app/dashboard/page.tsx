'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMarketLinkTheme } from '../../components/ThemeToggle';
import DashboardMetric from './DashboardMetric';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type User = { id: string; email: string; role: 'provider' | 'customer' | 'admin' };

type ExpertSummary = {
  id: string;
  slug: string;
  businessName: string;
  expertType?: 'agency' | 'freelancer' | 'creator' | 'specialist' | null;
  creatorPlatforms?: string[];
  creatorAudienceSize?: number | null;
  creatorProofSummary?: string | null;
  city: string;
  state: string;
  status: 'active' | 'pending' | 'disabled';
  disabledReason?: string;
} | null;

type ProviderStatsResponse = {
  ok?: boolean;
  stats?: {
    inquiryCount?: number;
    newInquiryCount?: number;
    matchedRequestCount?: number;
    needsProposalCount?: number;
    pendingProposalCount?: number;
    acceptedProposalCount?: number;
    conversationCount?: number;
  };
};

function formatExpertTypeLabel(expertType: NonNullable<ExpertSummary>['expertType']) {
  switch (expertType) {
    case 'agency':
      return 'Agency';
    case 'freelancer':
      return 'Freelancer';
    case 'creator':
      return 'Creator';
    case 'specialist':
      return 'Specialist';
    default:
      return 'Expert';
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useMarketLinkTheme();

  const [user, setUser] = useState<User | null>(null);
  const [expert, setExpert] = useState<ExpertSummary>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inquiryCount, setInquiryCount] = useState<number | null>(null);
  const [newInquiryCount, setNewInquiryCount] = useState<number | null>(null);
  const [matchedRequestCount, setMatchedRequestCount] = useState<number | null>(null);
  const [needsProposalCount, setNeedsProposalCount] = useState<number | null>(null);
  const [pendingProposalCount, setPendingProposalCount] = useState<number | null>(null);
  const [acceptedProposalCount, setAcceptedProposalCount] = useState<number | null>(null);
  const [conversationCount, setConversationCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/me/summary`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body?.error || `Failed (${res.status})`);
        }

        const data = (await res.json()) as { user?: User; expert?: ExpertSummary; provider?: ExpertSummary };

        if (data?.user?.role === 'admin') {
          router.replace('/dashboard/admin');
          return;
        }

        if (data?.user?.role === 'customer') {
          router.replace('/dashboard/customer');
          return;
        }

        setUser(data.user ?? null);
        setExpert(data.expert ?? data.provider ?? null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!expert) return;

    (async () => {
      try {
        const statsRes = await fetch(`${API_BASE}/me/provider-stats`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (statsRes.ok) {
          const body = (await statsRes.json()) as ProviderStatsResponse;
          setInquiryCount(body.stats?.inquiryCount ?? null);
          setNewInquiryCount(body.stats?.newInquiryCount ?? null);
          setMatchedRequestCount(body.stats?.matchedRequestCount ?? null);
          setNeedsProposalCount(body.stats?.needsProposalCount ?? null);
          setPendingProposalCount(body.stats?.pendingProposalCount ?? null);
          setAcceptedProposalCount(body.stats?.acceptedProposalCount ?? null);
          setConversationCount(body.stats?.conversationCount ?? null);
        }
      } catch {
        // ignore dashboard sidebar count failures
      }
    })();
  }, [expert]);

  const shellClass = 'ml-card rounded-xl p-5 sm:p-6';
  const primaryLinkClass = 'ml-btn-primary inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-white';

  if (loading) {
    return (
      <main className={`${t.pageBg} min-h-[calc(100vh-72px)]`}>
        <div className="dashboard-page-content mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className={shellClass}>
            <p role="status" className={`text-sm ${t.mutedText}`}>Loading dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={`${t.pageBg} min-h-[calc(100vh-72px)]`}>
        <div className="dashboard-page-content mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className={shellClass}>
            <p role="alert" className="text-sm text-red-700">Error: {error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const expertLocation = expert ? `${expert.city}, ${expert.state}` : null;
  const expertTypeLabel = expert ? formatExpertTypeLabel(expert.expertType) : null;
  const dashboardIntro = !expert
    ? 'Create your expert profile so local businesses can discover you by city and service.'
    : expert.status === 'active'
    ? 'Your profile is live and visible to local businesses.'
    : expert.status === 'pending'
    ? 'Your expert profile is pending review. Tighten the basics and proof so it is ready to go live.'
    : `Your expert profile is hidden from search.${expert.disabledReason ? ` Reason: ${expert.disabledReason}` : ''}`;
  const inquiryDetail = newInquiryCount === null ? undefined : `${newInquiryCount} new`;
  const proposalDetail = [
    needsProposalCount === null ? null : `${needsProposalCount} need${needsProposalCount === 1 ? 's' : ''} a proposal`,
    pendingProposalCount === null ? null : `${pendingProposalCount} awaiting a decision`,
    acceptedProposalCount === null ? null : `${acceptedProposalCount} accepted`,
  ].filter(Boolean).join(', ');

  return (
    <main className={`${t.pageBg} min-h-[calc(100vh-72px)]`}>
      <div className="dashboard-page-content mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="dashboard-intro flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Expert dashboard</h1>
            {expert ? (
              <p className="mt-2 text-base font-semibold">
                {expert.businessName} · {expertLocation}
              </p>
            ) : null}
            <p className="dashboard-intro-copy mt-2 max-w-2xl text-sm leading-6">{dashboardIntro}</p>
          </div>
          <Link href={expert ? '/dashboard/profile' : '/dashboard/onboarding'} className={`${primaryLinkClass} shrink-0 self-start lg:self-center`}>
            {expert ? 'Edit profile' : 'Create profile'}
          </Link>
        </section>

        <div className="mt-5 space-y-5">
          <section className={shellClass}>
            <h2 className="text-xl font-bold text-[#192a48]">{expert ? 'Marketplace activity' : 'Set up your expert profile'}</h2>
            {expert ? (
              <div className="mt-3 grid divide-y divide-slate-200 border-t border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <DashboardMetric
                  href="/dashboard/requests"
                  title="Matched requests"
                  value={matchedRequestCount}
                  detail={proposalDetail}
                />
                <DashboardMetric
                  href="/dashboard/inquiries"
                  title="Buyer inquiries"
                  value={inquiryCount}
                  detail={inquiryDetail}
                />
                <DashboardMetric
                  href="/dashboard/messages"
                  title="Conversations"
                  value={conversationCount}
                  detail="Private conversations"
                />
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-600">Add your business basics and services. Once your profile is live, inquiries and matched requests will appear here.</p>
            )}
          </section>

          <aside className={shellClass}>
            <h2 className="text-lg font-bold text-[#192a48]">Account</h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-600">Email</dt>
                <dd className="mt-1 break-all text-slate-900">{user.email}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-600">Profile</dt>
                <dd className="mt-1 text-slate-900">{expert ? `${expertTypeLabel} · ${expert.status}` : 'Setup required'}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
}

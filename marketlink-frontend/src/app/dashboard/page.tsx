'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMarketLinkTheme } from '../../components/ThemeToggle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type User = { id: string; email: string; role: 'provider' | 'admin' };

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

type InquiryRow = {
  id: string;
  status: 'NEW' | 'READ' | 'ARCHIVED';
  createdAt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useMarketLinkTheme();

  function Pill({ children }: { children: React.ReactNode }) {
    return <span className="ml-pill inline-flex items-center rounded-xl px-3 py-1 text-xs font-medium normal-case tracking-normal">{children}</span>;
  }

  function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-sm font-semibold text-slate-900">{children}</h2>;
  }

const [user, setUser] = useState<User | null>(null);
  const [expert, setExpert] = useState<ExpertSummary>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inquiryCount, setInquiryCount] = useState<number | null>(null);
  const [newInquiryCount, setNewInquiryCount] = useState<number | null>(null);

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
        const res = await fetch(`${API_BASE}/inquiries`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!res.ok) return;

        const body = (await res.json()) as { ok?: true; data?: InquiryRow[] };
        const rows = Array.isArray(body?.data) ? body.data : [];
        setInquiryCount(rows.length);
        setNewInquiryCount(rows.filter((r) => r.status === 'NEW').length);
      } catch {
        // ignore inquiry count failures on dashboard
      }
    })();
  }, [expert]);

  const shellClass = 'ml-card rounded-[28px] p-5 shadow-[0_18px_50px_rgba(23,26,31,0.06)] sm:p-6';
  const mutedCardClass = 'ml-surface-muted rounded-2xl p-4';
  const primaryLinkClass = 'ml-btn-primary rounded-xl px-5 py-3 text-sm font-semibold text-white';
  const secondaryLinkClass = 'ml-btn-secondary rounded-xl px-5 py-3 text-sm font-semibold text-slate-900';

  if (loading) {
    return (
      <main className={`${t.pageBg} min-h-[calc(100vh-72px)]`}>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className={shellClass}>
            <p className={`text-sm ${t.mutedText}`}>Loading dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={`${t.pageBg} min-h-[calc(100vh-72px)]`}>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className={shellClass}>
            <p className="text-sm text-red-700">Error: {error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const expertLocation = expert ? `${expert.city}, ${expert.state}` : 'Create your profile to get listed.';

  return (
    <main className={`${t.pageBg} min-h-[calc(100vh-72px)]`}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className={`${shellClass} overflow-hidden`}>
          <div className="h-1.5 bg-[linear-gradient(90deg,#0f172a,#25324a,#b6bdc8)] -mx-5 -mt-5 mb-5 sm:-mx-6 sm:-mt-6 sm:mb-6" />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Provider dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Dashboard</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-slate-900">{user.email}</span>
                <Pill>{user.role}</Pill>
                {expert ? <Pill>{expert.status}</Pill> : <Pill>Setup</Pill>}
              </div>
              <p className={`${t.mutedText} mt-3 text-sm`}>{expert ? `${expert.businessName} • ${expertLocation}` : expertLocation}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className={mutedCardClass}>
                <div className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Profile</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{expert ? expert.businessName : 'Not created'}</div>
              </div>
              <div className={mutedCardClass}>
                <div className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Inquiries</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{inquiryCount === null ? '—' : inquiryCount}</div>
              </div>
              <div className={`${mutedCardClass} col-span-2 sm:col-span-1`}>
                <div className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">New leads</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{newInquiryCount === null ? '—' : newInquiryCount}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]">
          <div className="order-1 space-y-5">
            {!expert ? (
              <section className={shellClass}>
                <div className="flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Set up your provider profile</h2>
                      <p className={`mt-2 text-sm ${t.mutedText}`}>Finish setup to appear in search and start getting inquiries.</p>
                    </div>
                    <Pill>Setup</Pill>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className={mutedCardClass}>
                      <SectionTitle>Business</SectionTitle>
                      <p className={`mt-1 text-sm ${t.mutedText}`}>Name, city, state</p>
                    </div>
                    <div className={mutedCardClass}>
                      <SectionTitle>Services</SectionTitle>
                      <p className={`mt-1 text-sm ${t.mutedText}`}>SEO, ads, social</p>
                    </div>
                    <div className={mutedCardClass}>
                      <SectionTitle>Polish</SectionTitle>
                      <p className={`mt-1 text-sm ${t.mutedText}`}>Logo, tagline</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link href="/dashboard/onboarding" className={primaryLinkClass}>
                      Create profile
                    </Link>
                    <span className={`text-xs ${t.mutedText}`}>Takes about 2-3 minutes.</span>
                  </div>
                </div>
              </section>
            ) : (
              <section className={shellClass}>
                <div className="flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{expert.businessName}</h2>
                      <p className={`mt-2 text-sm ${t.mutedText}`}>{expertLocation}</p>
                    </div>
                    <Pill>{expert.status}</Pill>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link href="/dashboard/profile" className={primaryLinkClass}>
                      Edit profile
                    </Link>
                    <Link href="/dashboard/inquiries" className={secondaryLinkClass}>
                      Inquiries
                      {newInquiryCount !== null && newInquiryCount > 0 ? <span className="ml-pill ml-2 rounded-xl px-2 py-0.5 text-xs normal-case tracking-normal">{newInquiryCount} new</span> : null}
                    </Link>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className={mutedCardClass}>
                      <SectionTitle>Next step</SectionTitle>
                      <p className={`mt-1 text-sm ${t.mutedText}`}>Check inquiries and reply fast.</p>
                    </div>
                    <div className={mutedCardClass}>
                      <SectionTitle>Discoverability</SectionTitle>
                      <p className={`mt-1 text-sm ${t.mutedText}`}>Add more services so you appear in more searches.</p>
                    </div>
                    <div className={mutedCardClass}>
                      <SectionTitle>Polish</SectionTitle>
                      <p className={`mt-1 text-sm ${t.mutedText}`}>Tighten your tagline and logo for stronger first impressions.</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className={shellClass}>
              <div className="flex items-start justify-between gap-4">
                <SectionTitle>Quick actions</SectionTitle>
                {expert ? <Pill>{inquiryCount === null ? 'Loading...' : `${inquiryCount} total`}</Pill> : <Pill>Setup first</Pill>}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link href={expert ? '/dashboard/inquiries' : '/dashboard/onboarding'} className={`${mutedCardClass} transition ${t.cardHover}`} aria-disabled={!expert}>
                  <div className="text-sm font-semibold text-slate-900">Inquiries</div>
                  <p className={`mt-1 text-sm ${t.mutedText}`}>{expert ? 'View and respond to leads.' : 'Create a profile first to receive leads.'}</p>
                </Link>

                <div className={mutedCardClass}>
                  <div className="text-sm font-semibold text-slate-900">Verification</div>
                  <p className={`mt-1 text-sm ${t.mutedText}`}>Get verified to rank higher.</p>
                </div>
              </div>
            </section>
          </div>

          <div className="order-2 space-y-5 xl:sticky xl:top-6 xl:self-start">
            <section className={shellClass}>
              <SectionTitle>Account</SectionTitle>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <div className={`text-xs uppercase tracking-[0.22em] ${t.mutedText}`}>Email</div>
                  <div className="mt-1 break-all font-mono text-slate-900">{user.email}</div>
                </div>
                <div>
                  <div className={`text-xs uppercase tracking-[0.22em] ${t.mutedText}`}>Role</div>
                  <div className="mt-1 text-slate-900">{user.role}</div>
                </div>
              </div>
            </section>

            <section className={shellClass}>
              <SectionTitle>Status</SectionTitle>
              <p className={`mt-3 text-sm ${t.mutedText}`}>
                {!expert
                  ? 'You are not listed yet. Complete setup to get discovered.'
                  : expert.status === 'active'
                  ? 'Your profile is live and visible in search.'
                  : expert.status === 'pending'
                  ? 'Your profile is pending review and not visible in search yet.'
                  : expert.status === 'disabled'
                  ? `Your profile is disabled and hidden from search.${expert.disabledReason ? ` Reason: ${expert.disabledReason}` : ''}`
                  : 'Your profile status is unknown.'}
              </p>
              {expert?.status === 'pending' ? <p className={`mt-3 text-xs ${t.mutedText}`}>Tip: make sure your services and city are accurate.</p> : null}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}


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

function formatExpertTypeLabel(expertType: ExpertSummary['expertType']) {
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
  const expertTypeLabel = expert ? formatExpertTypeLabel(expert.expertType) : null;
  const dashboardIntro = !expert
    ? 'Create your expert profile so local businesses can discover you by city and service.'
    : expert.status === 'active'
    ? 'Your expert profile is live. Keep it sharp so local businesses can compare, trust, and contact you faster.'
    : expert.status === 'pending'
    ? 'Your expert profile is pending review. Tighten the basics and proof so it is ready to go live.'
    : `Your expert profile is hidden from search.${expert.disabledReason ? ` Reason: ${expert.disabledReason}` : ''}`;
  const nextSteps = !expert
    ? [
        { title: 'Business basics', detail: 'Add your expert name, location, type, and services so buyers can understand what you do.' },
        { title: 'Discovery fit', detail: 'Use the same service categories buyers already browse from the homepage and directory.' },
        { title: 'Proof later', detail: 'After setup, you can add case studies, clients, media, pricing, and creator proof.' },
      ]
    : expert.status === 'active'
    ? [
        { title: 'Stay responsive', detail: newInquiryCount && newInquiryCount > 0 ? `You have ${newInquiryCount} new buyer inquiries waiting.` : 'Check inquiries regularly and reply quickly when a buyer reaches out.' },
        { title: 'Sharpen fit', detail: 'Keep services, short description, and expert type aligned with the kind of work you want more of.' },
        { title: 'Build trust', detail: 'Add stronger proof with case studies, featured clients, media, or creator signals.' },
      ]
    : expert.status === 'pending'
    ? [
        { title: 'Pending review', detail: 'Your profile is not public yet, so this is the right time to tighten the basics.' },
        { title: 'Strengthen proof', detail: 'Add projects, clients, media, or creator proof so the profile feels credible when it goes live.' },
        { title: 'Check discovery details', detail: 'Make sure city, expert type, and services reflect how buyers should actually find you.' },
      ]
    : [
        { title: 'Resolve the block', detail: expert.disabledReason || 'Update the profile details that caused it to be hidden from search.' },
        { title: 'Rebuild trust', detail: 'Use your profile editor to tighten positioning and add proof before the profile returns to search.' },
        { title: 'Watch inquiries', detail: 'Existing inquiry history still matters even while the public profile is hidden.' },
      ];

  return (
    <main className={`${t.pageBg} min-h-[calc(100vh-72px)]`}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className={`${shellClass} overflow-hidden`}>
          <div className="h-1.5 bg-[linear-gradient(90deg,#0f172a,#25324a,#b6bdc8)] -mx-5 -mt-5 mb-5 sm:-mx-6 sm:-mt-6 sm:mb-6" />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Expert dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Dashboard</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-slate-900">{user.email}</span>
                <Pill>{user.role}</Pill>
                {expertTypeLabel ? <Pill>{expertTypeLabel}</Pill> : null}
                {expert ? <Pill>{expert.status}</Pill> : <Pill>Setup</Pill>}
              </div>
              <p className={`${t.mutedText} mt-3 text-sm`}>{expert ? `${expert.businessName} • ${expertLocation}` : expertLocation}</p>
              <p className={`${t.mutedText} mt-2 max-w-3xl text-sm`}>{dashboardIntro}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className={mutedCardClass}>
                <div className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Expert profile</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{expert ? expert.businessName : 'Not created'}</div>
              </div>
              <div className={mutedCardClass}>
                <div className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Buyer inquiries</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{inquiryCount === null ? '—' : inquiryCount}</div>
              </div>
              <div className={`${mutedCardClass} col-span-2 sm:col-span-1`}>
                <div className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">New inquiries</div>
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
                      <h2 className="text-xl font-semibold text-slate-900">Set up your expert profile</h2>
                      <p className={`mt-2 text-sm ${t.mutedText}`}>Finish setup to appear in city-and-service discovery and start getting buyer inquiries.</p>
                    </div>
                    <Pill>Setup</Pill>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className={mutedCardClass}>
                      <SectionTitle>Core info</SectionTitle>
                      <p className={`mt-1 text-sm ${t.mutedText}`}>Name, city, expert type</p>
                    </div>
                    <div className={mutedCardClass}>
                      <SectionTitle>Discovery fit</SectionTitle>
                      <p className={`mt-1 text-sm ${t.mutedText}`}>Match homepage service categories</p>
                    </div>
                    <div className={mutedCardClass}>
                      <SectionTitle>Proof later</SectionTitle>
                      <p className={`mt-1 text-sm ${t.mutedText}`}>Add trust signals after setup</p>
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
                    {nextSteps.map((step) => (
                      <div key={step.title} className={mutedCardClass}>
                        <SectionTitle>{step.title}</SectionTitle>
                        <p className={`mt-1 text-sm ${t.mutedText}`}>{step.detail}</p>
                      </div>
                    ))}
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
                  <div className="text-sm font-semibold text-slate-900">Buyer inquiries</div>
                  <p className={`mt-1 text-sm ${t.mutedText}`}>{expert ? 'Review new messages, triage active buyers, and keep response times tight.' : 'Create your expert profile first to receive inquiries.'}</p>
                </Link>

                <div className={mutedCardClass}>
                  <div className="text-sm font-semibold text-slate-900">Profile strength</div>
                  <p className={`mt-1 text-sm ${t.mutedText}`}>{expert ? 'Improve trust with better proof, sharper services, and clearer positioning.' : 'A stronger setup now makes the public profile easier to trust later.'}</p>
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
                  ? 'You are not listed yet. Complete setup so local businesses can discover you.'
                  : expert.status === 'active'
                  ? 'Your expert profile is live and visible in search.'
                  : expert.status === 'pending'
                  ? 'Your expert profile is pending review and not visible in search yet.'
                  : expert.status === 'disabled'
                  ? `Your expert profile is disabled and hidden from search.${expert.disabledReason ? ` Reason: ${expert.disabledReason}` : ''}`
                  : 'Your profile status is unknown.'}
              </p>
              {expert?.status === 'pending' ? <p className={`mt-3 text-xs ${t.mutedText}`}>Tip: make sure expert type, services, and city are accurate before the profile goes live.</p> : null}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}


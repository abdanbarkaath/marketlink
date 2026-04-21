'use client';

import Link from 'next/link';
import ThemeToggle, { useMarketLinkTheme } from '@/components/ThemeToggle';

const CATEGORIES = [
  { token: 'seo', title: 'SEO', desc: 'Rank higher, get more organic leads.' },
  { token: 'social', title: 'Social Media', desc: 'Content, growth, and engagement.' },
  { token: 'ads', title: 'Paid Ads', desc: 'Google, Meta, TikTok, and more.' },
  { token: 'web', title: 'Web Development', desc: 'Landing pages, sites, and conversions.' },
  { token: 'branding', title: 'Branding', desc: 'Logos, identity, and positioning.' },
  { token: 'email', title: 'Email Marketing', desc: 'Newsletters, automations, retention.' },
  { token: 'content', title: 'Content', desc: 'Copywriting, blogs, and strategy.' },
  { token: 'video', title: 'Photo + Video', desc: 'Production, editing, short-form.' },
];

const BUYER_SIGNALS = [
  { label: 'Use case', value: 'Local growth teams', detail: 'Search by city, category, and fit.' },
  { label: 'Best for', value: 'Fast provider discovery', detail: 'Go from need to shortlist in minutes.' },
  { label: 'Workflow', value: 'Browse, compare, inquire', detail: 'No map clutter, just decision-ready profiles.' },
];

export default function Home() {
  const { t } = useMarketLinkTheme();

  return (
    <main className={`${t.pageBg} min-h-[calc(100vh-80px)]`}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <section className={`overflow-hidden rounded-[2rem] ${t.card} px-5 py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-10`}>
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr] lg:items-stretch">
            <div className="flex flex-col gap-6">
              <div className="space-y-4">
                <div className={`inline-flex items-center rounded-xl px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] shadow-sm ${t.brandBadge}`}>
                  MarketLink discovery
                </div>
                <div className="max-w-3xl">
                  <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-900 sm:text-5xl">
                    Find local marketing experts without wasting time on generic directories.
                  </h1>
                  <p className={`mt-4 max-w-2xl text-sm leading-7 sm:text-base sm:leading-8 ${t.mutedText}`}>
                    Browse specialist teams by service, city, and fit. Start with the kind of work you need, then move directly into richer provider pages built for comparison.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/providers"
                  className={`inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold shadow-sm ${t.primaryBtn}`}
                >
                  Browse all providers
                </Link>
                <Link
                  href="/providers"
                  className={`inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-sm font-medium ${t.secondaryBtn}`}
                >
                  Use filters
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {BUYER_SIGNALS.map((item) => (
                  <div key={item.label} className={`rounded-[1.5rem] ${t.surfaceMuted} ${t.border} border px-4 py-4 shadow-sm`}>
                    <div className={`text-[11px] font-medium uppercase tracking-[0.22em] ${t.mutedText}`}>{item.label}</div>
                    <div className="mt-2 text-base font-semibold text-slate-900">{item.value}</div>
                    <p className={`mt-2 text-sm leading-6 ${t.mutedText}`}>{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className={`ml-dark-panel flex h-full flex-col justify-between rounded-[1.75rem] px-5 py-5 text-white shadow-[0_24px_70px_rgba(23,26,31,0.24)] sm:px-6 sm:py-6`}>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/60">How it works</div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">Start from the work, not the noise.</h2>
                <div className="mt-5 space-y-3">
                  <div className="rounded-[1.35rem] border border-white/10 bg-white/7 px-4 py-3.5">
                    <div className="text-sm font-semibold">1. Pick a category</div>
                    <p className="mt-1 text-sm leading-6 text-white/76">SEO, paid ads, branding, web, or the exact service your team needs next.</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/10 bg-white/7 px-4 py-3.5">
                    <div className="text-sm font-semibold">2. Compare local options</div>
                    <p className="mt-1 text-sm leading-6 text-white/76">Review positioning, industries served, proof of work, and direct contact details in one place.</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/10 bg-white/7 px-4 py-3.5">
                    <div className="text-sm font-semibold">3. Reach out when it fits</div>
                    <p className="mt-1 text-sm leading-6 text-white/76">Use the provider page to decide faster instead of bouncing across tabs and half-complete profiles.</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/7 px-4 py-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/60">MVP direction</div>
                <p className="mt-2 text-sm leading-6 text-white/82">Search is city + service first. No maps, no radius clutter, just cleaner local discovery.</p>
                <div className="mt-4 hidden sm:block">
                  <ThemeToggle compact />
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-6 sm:mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className={`text-[11px] font-medium uppercase tracking-[0.24em] ${t.mutedText}`}>Browse by need</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-900">Choose the type of marketing help you need.</h2>
            </div>
            <p className={`max-w-xl text-sm leading-7 ${t.mutedText}`}>
              Every category routes into the same provider directory with filters already applied, so users can start broad and narrow down without learning a complicated interface.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 sm:grid-cols-2 xl:grid-cols-4">
            {CATEGORIES.map((c, index) => (
              <Link
                key={c.token}
                href={`/providers?service=${encodeURIComponent(c.token)}`}
                className={[
                  'group flex min-h-[190px] flex-col justify-between rounded-[1.75rem] p-4 transition sm:min-h-[220px] sm:p-5',
                  t.card,
                  t.cardHover,
                  index === 0 || index === 3 ? 'xl:min-h-[250px]' : '',
                ].join(' ')}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex items-center rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] shadow-sm ${t.brandBadge}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${t.accentDot}`} />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">{c.title}</h3>
                  <p className={`mt-3 text-sm leading-7 ${t.mutedText}`}>{c.desc}</p>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-900">View providers</span>
                    <span className="text-lg text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-600" aria-hidden="true">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className={`rounded-[1.75rem] ${t.surface} ${t.border} border px-6 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]`}>
            <div className={`text-[11px] font-medium uppercase tracking-[0.22em] ${t.mutedText}`}>What makes this different</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Built for quick local decisions.</h2>
            <div className="mt-5 space-y-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">Less browsing noise</div>
                <p className={`mt-1 text-sm leading-6 ${t.mutedText}`}>No endless agency pages with shallow metadata and no useful context.</p>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Stronger provider pages</div>
                <p className={`mt-1 text-sm leading-6 ${t.mutedText}`}>Users see positioning, services, work examples, industries, and contact points in a single flow.</p>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">MVP-simple search</div>
                <p className={`mt-1 text-sm leading-6 ${t.mutedText}`}>The experience stays focused on city, service, and fit until proximity search is worth the added complexity.</p>
              </div>
            </div>
          </div>

          <div className="ml-dark-panel rounded-[1.75rem] px-6 py-6 text-white shadow-[0_24px_70px_rgba(23,26,31,0.20)]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/60">Next step</div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">Need more control than categories alone?</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/78">
                  Jump into the full providers page for direct filtering by city, rating, service, and verified status.
                </p>
              </div>
              <Link
                href="/providers"
                className="ml-btn-secondary inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold transition"
              >
                Go to filters
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


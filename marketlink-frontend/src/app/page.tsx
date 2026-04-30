'use client';

import Link from 'next/link';
import { useMarketLinkTheme } from '@/components/ThemeToggle';
import {
  getDiscoveryProblemHref,
  getDiscoveryServicePathsForProblem,
  homepageProblemCards,
  homepageServicePaths,
} from '@/lib/discovery';

const BUYER_SIGNALS = [
  { label: 'Built for', value: 'Local businesses' },
  { label: 'Best for', value: 'Quick shortlists' },
  { label: 'How it works', value: 'Browse, compare, contact' },
];

const MOBILE_PROBLEM_CARD_IDS = new Set([
  'cant-find-business',
  'need-more-calls',
  'website-not-helping',
  'not-sure-what-i-need',
]);

const DESKTOP_PROBLEM_CARD_IDS = new Set([
  'cant-find-business',
  'need-more-calls',
  'website-not-helping',
  'social-not-working',
]);

const DESKTOP_HERO_PROBLEM_CARD_IDS = new Set([
  'cant-find-business',
  'need-more-calls',
  'website-not-helping',
]);

export default function Home() {
  const { t } = useMarketLinkTheme();
  const mobileProblemCards = homepageProblemCards.filter((problem) => MOBILE_PROBLEM_CARD_IDS.has(problem.id));
  const desktopProblemCards = homepageProblemCards.filter((problem) => DESKTOP_PROBLEM_CARD_IDS.has(problem.id));
  const desktopHeroProblemCards = desktopProblemCards.filter((problem) => DESKTOP_HERO_PROBLEM_CARD_IDS.has(problem.id));

  return (
    <main className={`${t.pageBg} min-h-[calc(100vh-80px)]`}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <section className={`overflow-hidden rounded-[2rem] ${t.card} px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/80 lg:hidden`}>
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] shadow-sm ${t.brandBadge}`}>
            Local marketing help
          </div>

          <h1 className="mt-5 text-[2.75rem] font-semibold leading-[0.92] tracking-[-0.075em] text-slate-950">
            Find marketing help by the problem you need solved.
          </h1>
          <p className={`mt-4 text-[1.02rem] leading-7 ${t.mutedText}`}>
            Start with what feels stuck, then compare local experts who can help with the next move.
          </p>

          <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-3">
            <Link
              href="/experts"
              className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold shadow-sm ${t.primaryBtn}`}
            >
              Browse experts
            </Link>
            <Link href="#mobile-problems" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-50 px-4 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200">
              Help me choose
            </Link>
          </div>

          <div id="mobile-problems" className="mt-7">
            <div className={`text-[11px] font-medium uppercase tracking-[0.22em] ${t.mutedText}`}>Start with the problem</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">What do you need help fixing first?</h2>

            <div className="mt-4 space-y-3">
              {mobileProblemCards.map((problem, index) => {
                const suggestedPaths = getDiscoveryServicePathsForProblem(problem);

                return (
                  <Link
                    key={problem.id}
                    href={getDiscoveryProblemHref(problem)}
                    data-testid="mobile-problem-card"
                    className={`group block rounded-[1.45rem] ${t.surfaceMuted} ${t.border} border px-4 py-4 shadow-sm transition active:scale-[0.99]`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className={`text-[10px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Problem {index + 1}</div>
                        <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-slate-950">{problem.problemTitle}</h3>
                      </div>
                      <span className="mt-1 text-lg text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" aria-hidden="true">
                        &rarr;
                      </span>
                    </div>

                    <p className={`mt-2 text-sm leading-6 ${t.mutedText}`}>{problem.customerLanguage}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {suggestedPaths.slice(0, 3).map((path) => (
                        <span key={path.id} className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80">
                          {path.plainLabel}
                        </span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className={`hidden overflow-hidden rounded-[2rem] ${t.card} px-5 py-5 sm:px-8 sm:py-8 lg:block lg:px-10 lg:py-10`}>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.72fr)] lg:items-center">
            <div className="flex flex-col gap-6">
              <div className="space-y-4">
                <div className={`inline-flex items-center rounded-xl px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] shadow-sm ${t.brandBadge}`}>
                  Find local marketing help
                </div>
                <div className="max-w-3xl">
                  <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-900 sm:text-5xl">
                    Find marketers, website builders, and other local experts for your business.
                  </h1>
                  <p className={`mt-4 max-w-2xl text-sm leading-7 sm:text-base sm:leading-8 ${t.mutedText}`}>
                    Browse by service, narrow by city, and compare real local experts in one place. When someone looks like a fit, open their profile and contact them directly.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/experts"
                  className={`inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold shadow-sm ${t.primaryBtn}`}
                >
                  Browse local experts
                </Link>
                <Link
                  href="#browse-by-need"
                  className={`inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-sm font-medium ${t.secondaryBtn}`}
                >
                  Search by service
                </Link>
              </div>

              <div
                data-testid="desktop-buyer-signal-row"
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm ${t.mutedText}`}
              >
                {BUYER_SIGNALS.map((item) => (
                  <div key={item.label} data-testid="desktop-buyer-signal" className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${t.accentDot}`} aria-hidden="true" />
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <aside
              data-testid="desktop-problem-panel"
              className={`rounded-[1.75rem] ${t.surfaceMuted} ${t.border} border px-5 py-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-6 sm:py-6`}
            >
              <div>
                <div className={`text-[11px] font-medium uppercase tracking-[0.24em] ${t.mutedText}`}>Problem-first discovery</div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Choose a starting point</h2>
                <p className={`mt-2 text-sm leading-6 ${t.mutedText}`}>
                  Pick the closest business problem and jump into a matching expert shortlist.
                </p>
              </div>

              <div className="mt-5 grid gap-2.5">
                {desktopHeroProblemCards.map((problem) => (
                  <Link
                    key={problem.id}
                    href={getDiscoveryProblemHref(problem)}
                    data-testid="desktop-problem-link"
                    className="group flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      <h3 className="text-sm font-semibold tracking-[-0.01em] text-slate-950">{problem.problemTitle}</h3>
                      <p className={`mt-1 text-xs leading-5 ${t.mutedText}`}>{problem.outcomePromise}</p>
                    </div>
                    <span className="text-lg text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" aria-hidden="true">
                      &rarr;
                    </span>
                  </Link>
                ))}
              </div>

              <div className={`mt-5 rounded-2xl bg-white/70 px-4 py-3 text-sm leading-6 ${t.mutedText} ring-1 ring-slate-200/70`}>
                Already know the service? Use search by service or browse the full expert directory.
              </div>
            </aside>
          </div>
        </section>

        <section id="desktop-problems" data-testid="desktop-problem-section" className="mt-6 hidden lg:block">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className={`text-[11px] font-medium uppercase tracking-[0.24em] ${t.mutedText}`}>Start with the problem</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-900">What do you need help fixing first?</h2>
            </div>
            <p className={`max-w-xl text-sm leading-7 ${t.mutedText}`}>
              These are plain-language starting points for owners who know what feels broken, but not which marketing service to search for.
            </p>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-4">
            {desktopProblemCards.map((problem) => {
              const suggestedPaths = getDiscoveryServicePathsForProblem(problem);

              return (
                <Link
                  key={problem.id}
                  href={getDiscoveryProblemHref(problem)}
                  data-testid="desktop-problem-card"
                  className={`group flex min-h-[230px] flex-col justify-between rounded-[1.75rem] ${t.card} p-5 transition ${t.cardHover}`}
                >
                  <div>
                    <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Problem</div>
                    <div className="mt-3 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">{problem.problemTitle}</h3>
                        <p className={`mt-2 text-sm leading-6 ${t.mutedText}`}>{problem.customerLanguage}</p>
                      </div>
                      <span className="mt-1 text-lg text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" aria-hidden="true">
                        &rarr;
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {suggestedPaths.slice(0, 3).map((path) => (
                      <span key={path.id} className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                        {path.plainLabel}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="browse-by-need" className="mt-6 scroll-mt-24 sm:mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className={`text-[11px] font-medium uppercase tracking-[0.24em] ${t.mutedText}`}>Browse by need</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-900">What do you need help with?</h2>
            </div>
            <p className={`max-w-xl text-sm leading-7 ${t.mutedText}`}>
              Pick a category and go straight into the expert directory with the right filter already applied.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 sm:grid-cols-2 xl:grid-cols-4">
            {homepageServicePaths.map((path, index) => (
              <Link
                key={path.id}
                href={path.href}
                data-testid="service-path-card"
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
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">{path.plainLabel}</h3>
                  <div className={`mt-2 text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>
                    {path.technicalLabel}
                  </div>
                  <p className={`mt-3 text-sm leading-7 ${t.mutedText}`}>{path.shortHelp}</p>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-900">See experts</span>
                    <span className="text-lg text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-600" aria-hidden="true">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className={`rounded-[1.75rem] ${t.surface} ${t.border} border px-6 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]`}>
            <div className={`text-[11px] font-medium uppercase tracking-[0.22em] ${t.mutedText}`}>What makes this different</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Made for quick business decisions.</h2>
            <div className="mt-5 space-y-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">Simple starting points</div>
                <p className={`mt-1 text-sm leading-6 ${t.mutedText}`}>Start with the kind of help you need instead of guessing where to begin.</p>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Easier profiles to compare</div>
                <p className={`mt-1 text-sm leading-6 ${t.mutedText}`}>See what an expert does, who they help, and how to contact them without extra clutter.</p>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Search that stays simple</div>
                <p className={`mt-1 text-sm leading-6 ${t.mutedText}`}>Filter by city, service, rating, and verified status without learning a complicated tool.</p>
              </div>
            </div>
          </div>

          <div className="ml-dark-panel rounded-[1.75rem] px-6 py-6 text-white shadow-[0_24px_70px_rgba(23,26,31,0.20)]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/60">Next step</div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">Want to narrow it down faster?</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/78">
                  Open the expert directory and filter by city, service, rating, and verified status.
                </p>
              </div>
              <Link
                href="/experts"
                className="ml-btn-secondary inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold transition"
              >
                Open directory
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


'use client';

import Link from 'next/link';
import MarketLinkHeroIllustration from '@/components/MarketLinkHeroIllustration';
import NearbyRadiusField from '@/components/NearbyRadiusField';
import { useMarketLinkTheme } from '@/components/ThemeToggle';
import {
  getDiscoveryProblemHref,
  getDiscoveryServicePathsForProblem,
  homepageProblemCards,
  homepageServicePaths,
} from '@/lib/discovery';

const FEATURED_PROBLEM_IDS = new Set([
  'cant-find-business',
  'need-more-calls',
  'website-not-helping',
  'social-not-working',
]);

const FEATURED_SERVICE_IDS = new Set([
  'show-up-on-google',
  'run-local-ads',
  'improve-website',
  'grow-on-social',
]);

export default function Home() {
  const { t } = useMarketLinkTheme();
  const featuredProblems = homepageProblemCards.filter((problem) => FEATURED_PROBLEM_IDS.has(problem.id));
  const featuredServices = homepageServicePaths.filter((path) => FEATURED_SERVICE_IDS.has(path.id));

  return (
    <main className={`${t.pageBg} min-h-[calc(100vh-80px)]`}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="ml-card ml-hero-grid ml-ambient-shell overflow-hidden rounded-[2rem] px-5 py-5 shadow-[0_26px_90px_rgba(18,26,42,0.11)] sm:px-7 sm:py-7 lg:px-8 lg:py-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <div className="min-w-0">
              <div className="ml-brand-badge inline-flex items-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] shadow-sm">
                Local marketing, clearer decisions
              </div>

              <h1 className="font-display mt-5 text-[3rem] leading-[0.9] text-slate-950 sm:text-[4.15rem] lg:text-[4.7rem]">
                Find the local marketing partner worth contacting first.
              </h1>

              <p className={`mt-5 max-w-2xl text-[1rem] leading-8 ${t.mutedText}`}>
                Start with one nearby search, then move straight into the shortlist and map. The goal is to make the first click feel obvious.
              </p>

              <div className="mt-6 rounded-[1.65rem] bg-white/90 p-4 shadow-[0_18px_40px_rgba(18,26,42,0.08)] ring-1 ring-slate-200/80 sm:p-5">
                <div>
                  <div>
                    <div className={`text-[11px] font-medium uppercase tracking-[0.24em] ${t.mutedText}`}>Start nearby</div>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Search nearby first, then open the shortlist that looks worth contacting.</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Use location and distance here, or{' '}
                    <Link href="/experts" className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">
                      open the full directory
                    </Link>
                    .
                  </p>
                </div>

                <form action="/experts" method="GET" className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <NearbyRadiusField
                    initialRadius="10"
                    zipRequired
                    compact
                    fieldClassName="ml-input w-full rounded-[1.15rem] px-4 py-3.5 text-sm"
                    zipLabel="Location ZIP"
                    zipPlaceholder="Enter ZIP code"
                    helperText="Start with a 5-digit ZIP code and choose the distance."
                  />
                  <button
                    type="submit"
                    className={`inline-flex min-h-12 items-center justify-center rounded-[1.15rem] px-6 text-sm font-semibold shadow-sm ${t.primaryBtn}`}
                  >
                    Search nearby experts
                  </button>
                </form>
              </div>
            </div>

            <div className="grid gap-4">
              <MarketLinkHeroIllustration />
              <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/74 px-4 py-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.1rem] bg-white/80 px-3 py-3 ring-1 ring-slate-200/80">
                    <div className={`text-[11px] font-medium uppercase tracking-[0.2em] ${t.mutedText}`}>Map first</div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">Real pins stay beside the shortlist.</p>
                  </div>
                  <div className="rounded-[1.1rem] bg-white/80 px-3 py-3 ring-1 ring-slate-200/80">
                    <div className={`text-[11px] font-medium uppercase tracking-[0.2em] ${t.mutedText}`}>Clear filters</div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">Location and service do most of the work.</p>
                  </div>
                  <div className="rounded-[1.1rem] bg-white/80 px-3 py-3 ring-1 ring-slate-200/80">
                    <div className={`text-[11px] font-medium uppercase tracking-[0.2em] ${t.mutedText}`}>Fast scan</div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">Profiles open without extra card layers.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className={`text-[11px] font-medium uppercase tracking-[0.24em] ${t.mutedText}`}>What do you need help with?</div>
              <h2 className="font-display mt-2 text-[2.2rem] text-slate-950">Start with the business problem.</h2>
            </div>
            <Link href="/experts" className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">
              Open the full directory
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredProblems.map((problem, index) => {
              const suggestedPaths = getDiscoveryServicePathsForProblem(problem);

              return (
                <Link
                  key={problem.id}
                  href={getDiscoveryProblemHref(problem)}
                  className="ml-card-hover group overflow-hidden rounded-[1.6rem] bg-white px-5 py-5 shadow-[0_16px_40px_rgba(18,26,42,0.06)] ring-1 ring-slate-200/80 transition hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(18,26,42,0.1)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="ml-brand-badge inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                      Problem {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-lg text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" aria-hidden="true">
                      &rarr;
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">{problem.problemTitle}</h3>
                  <p className={`mt-2 text-sm leading-7 ${t.mutedText}`}>{problem.customerLanguage}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {suggestedPaths.slice(0, 2).map((path) => (
                      <span key={path.id} className="ml-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                        {path.plainLabel}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="browse-by-need" className="mt-8 scroll-mt-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className={`text-[11px] font-medium uppercase tracking-[0.24em] ${t.mutedText}`}>Popular services</div>
              <h2 className="font-display mt-2 text-[2.15rem] text-slate-950">Or choose the type of help directly.</h2>
            </div>
            <Link href="/experts" className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">
              See every service in the directory
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredServices.map((path, index) => (
              <Link
                key={path.id}
                href={path.href}
                data-testid="service-path-card"
                className={[
                  'ml-card-hover group flex min-h-[210px] flex-col justify-between overflow-hidden rounded-[1.8rem] p-5 transition',
                  index % 2 === 0 ? 'ml-dark-panel text-white' : 'ml-card',
                ].join(' ')}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${index % 2 === 0 ? 'bg-white/12 text-white/88' : 'ml-brand-badge'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${index % 2 === 0 ? 'bg-white/70' : t.accentDot}`} />
                  </div>

                  <h3 className={`mt-5 text-[1.35rem] font-semibold tracking-tight ${index % 2 === 0 ? 'text-white' : 'text-slate-900'}`}>
                    {path.plainLabel}
                  </h3>
                  <div className={`mt-2 text-[11px] font-medium uppercase tracking-[0.18em] ${index % 2 === 0 ? 'text-white/60' : t.mutedText}`}>
                    {path.technicalLabel}
                  </div>
                  <p className={`mt-3 text-sm leading-7 ${index % 2 === 0 ? 'text-white/78' : t.mutedText}`}>{path.shortHelp}</p>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <span className={`text-sm font-semibold ${index % 2 === 0 ? 'text-white' : 'text-slate-900'}`}>See experts</span>
                  <span className={`text-lg transition group-hover:translate-x-1 ${index % 2 === 0 ? 'text-white/65 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-600'}`} aria-hidden="true">
                    &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

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

export default function Home() {
  const { t } = useMarketLinkTheme();

  return (
    <main className={`${t.pageBg} min-h-[calc(100vh-72px)]`}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <header className="flex flex-col gap-4">
          <div className={`rounded-3xl ${t.surfaceMuted} ${t.border} border p-5 sm:p-7 shadow-[0_14px_45px_rgba(2,6,23,0.08)]`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Find local marketing experts</h1>
                <p className={`mt-2 text-sm ${t.mutedText}`}>Pick a category to browse verified providers in your area.</p>
              </div>

              {/* On mobile this becomes a select */}
              <div className="sm:shrink-0">
                <ThemeToggle />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link href="/providers" className={`w-full sm:w-auto rounded-xl px-4 py-3 text-sm font-semibold text-center shadow-sm ${t.primaryBtn}`}>
                Browse all providers
              </Link>

              <Link href="/providers" className={`w-full sm:w-auto rounded-xl px-4 py-3 text-sm font-medium text-center ${t.secondaryBtn}`}>
                Use filters
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-6 sm:mt-10 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link key={c.token} href={`/providers?service=${encodeURIComponent(c.token)}`} className={['group rounded-2xl p-5 transition', t.card, t.cardHover, 'hover:-translate-y-0.5'].join(' ')}>
              <div className="mb-3 inline-flex items-center rounded-full border border-slate-200/70 bg-white/70 px-2 py-1 text-xs text-slate-600">
                <span className={`mr-2 inline-block h-2 w-2 rounded-full ${t.accentDot}`} />
                Category
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{c.title}</h2>
                  <p className={`mt-1 text-sm ${t.mutedText}`}>{c.desc}</p>
                </div>
                <span className="text-slate-400 transition group-hover:translate-x-0.5">→</span>
              </div>

              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                View providers
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${t.accentDot}`} />
              </div>
            </Link>
          ))}
        </section>

        <footer className={`mt-6 sm:mt-10 rounded-2xl ${t.surface} ${t.border} border p-4 sm:p-6 shadow-[0_14px_45px_rgba(2,6,23,0.06)]`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-sm ${t.mutedText}`}>Want more control? Use filters on the providers page.</p>
            <Link href="/providers" className="text-sm font-semibold underline underline-offset-4 hover:opacity-80">
              Go to filters
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

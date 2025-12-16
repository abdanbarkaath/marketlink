import Link from 'next/link';

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
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Find local marketing experts</h1>
          <p className="mt-2 text-gray-600">Pick a category to browse verified providers in your area.</p>
        </div>

        {/* Optional: keep this single CTA. Remove if you want homepage to be cards-only. */}
        <Link href="/providers" className="rounded-xl border px-4 py-3 font-medium hover:bg-gray-50">
          Browse all providers
        </Link>
      </header>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Link key={c.token} href={`/providers?service=${encodeURIComponent(c.token)}`} className="group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{c.title}</h2>
                <p className="mt-1 text-sm text-gray-600">{c.desc}</p>
              </div>
              <span className="text-gray-400 transition group-hover:translate-x-0.5">→</span>
            </div>

            <div className="mt-4 text-sm font-medium text-gray-700">View providers</div>
          </Link>
        ))}
      </section>

      <footer className="mt-10 rounded-2xl border p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">Want more control? Use filters on the providers page.</p>
          <Link href="/providers" className="text-sm font-medium underline underline-offset-4 hover:opacity-80">
            Go to filters
          </Link>
        </div>
      </footer>
    </main>
  );
}

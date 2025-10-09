// src/app/providers/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { MOCK_PROVIDERS } from '@/lib/mockProviders';
import ContactForm from '@/components/ContactForm';

type Props = {
  params: { slug: string };
};

export default function ProviderProfile({ params }: Props) {
  const provider = MOCK_PROVIDERS.find((p) => p.slug === params.slug);
  if (!provider) return notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={provider.logo ?? 'https://placehold.co/96x96'} alt={provider.businessName} className="h-20 w-20 rounded-2xl object-cover" />
        <div>
          <h1 className="text-2xl font-semibold">{provider.businessName}</h1>
          <p className="text-gray-600">
            {provider.city}, {provider.state}
          </p>
          <div className="text-sm text-gray-700 mt-1">
            <span>{provider.rating ? `${provider.rating.toFixed(1)} ★` : 'No rating'}</span>
            {provider.verified ? <span className="ml-2 rounded-full border px-2 py-0.5 text-xs">Verified</span> : null}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-sm text-gray-500">
            {/* Distance will be real in Pass B */}~{provider.distance?.toFixed(1) ?? '—'} mi away
          </div>
        </div>
      </header>

      {provider.tagline && <p className="mt-4 text-lg">{provider.tagline}</p>}

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">About</h2>
          <p className="mt-2 text-sm text-gray-700">
            {/* Placeholder until real description */}
            We help local businesses grow with targeted campaigns and measurable ROI.
          </p>

          <h3 className="mt-6 text-base font-semibold">Services</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {provider.services.map((s) => (
              <span key={s} className="text-xs rounded-full border px-2 py-1">
                {s}
              </span>
            ))}
          </div>

          <h3 className="mt-6 text-base font-semibold">Portfolio (preview)</h3>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="aspect-video rounded-xl bg-gray-100" />
            <div className="aspect-video rounded-xl bg-gray-100" />
          </div>
        </div>

        <aside className="rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">Contact</h2>
          <ContactForm />
          <p className="mt-3 text-xs text-gray-500">(Mock only — real email relay in Phase 2.)</p>
        </aside>
      </section>
    </main>
  );
}

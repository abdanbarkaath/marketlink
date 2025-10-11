import { notFound } from 'next/navigation';
import ContactForm from '@/components/ContactForm';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Provider = {
  id: string;
  email: string;
  businessName: string;
  slug: string;
  tagline?: string | null;
  city: string;
  state: string;
  zip?: string | null;
  rating?: number | null;
  verified: boolean;
  logo?: string | null;
  services: string[];
};

async function getProvider(slug: string): Promise<Provider | null> {
  const res = await fetch(`${API_BASE}/providers/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch provider: ${res.status}`);

  return res.json();
}

export default async function ProviderProfile({ params }: { params: { slug: string } }) {
  const provider = await getProvider(params.slug);
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
            <span>{typeof provider.rating === 'number' ? `${provider.rating.toFixed(1)} ★` : 'No rating'}</span>
            {provider.verified ? <span className="ml-2 rounded-full border px-2 py-0.5 text-xs">Verified</span> : null}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-sm text-gray-500">
            {/* Distance later when radius/lat,lng arrive */}
            ~— mi away
          </div>
        </div>
      </header>

      {provider.tagline && <p className="mt-4 text-lg">{provider.tagline}</p>}

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">About</h2>
          <p className="mt-2 text-sm text-gray-700">
            {/* Placeholder until real description field */}
            We help local businesses grow with targeted campaigns and measurable ROI.
          </p>

          <h3 className="mt-6 text-base font-semibold">Services</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {provider.services?.map((s) => (
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
          <p className="mt-3 text-xs text-gray-500">(Mock only — real email relay in a later phase.)</p>
        </aside>
      </section>
    </main>
  );
}

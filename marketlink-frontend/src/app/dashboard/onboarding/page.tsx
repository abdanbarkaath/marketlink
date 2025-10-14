'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Canonical service tokens you already use
const SERVICE_OPTIONS = [
  { value: 'seo', label: 'SEO' },
  { value: 'ads', label: 'Ads' },
  { value: 'social', label: 'Social' },
  { value: 'video', label: 'Video' },
  { value: 'print', label: 'Print' },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [tagline, setTagline] = useState('');
  const [logo, setLogo] = useState('');
  const [services, setServices] = useState<string[]>([]);

  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  function toggleService(val: string) {
    setServices((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    try {
      // quick client validation
      if (!businessName.trim()) throw new Error('Business name is required.');
      if (!city.trim()) throw new Error('City is required.');
      if (!state.trim()) throw new Error('State is required.');

      const res = await fetch(`${API_BASE}/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // send session cookie
        body: JSON.stringify({
          businessName: businessName.trim(),
          city: city.trim(),
          state: state.trim(),
          zip: zip.trim() || undefined,
          tagline: tagline.trim() || undefined,
          logo: logo.trim() || undefined,
          services, // server lowercases/normalizes too
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({} as any));
        throw new Error(body?.error || `Failed (${res.status})`);
      }

      const data = await res.json();
      const slug = data?.provider?.slug as string | undefined;

      // Go straight to the public page (owner will see Edit button later)
      if (slug) {
        router.replace(`/providers/${slug}`);
        return;
      }

      // fallback: go back to dashboard
      router.replace('/dashboard');
    } catch (err: any) {
      setStatus('error');
      setError(err?.message || 'Something went wrong.');
    } finally {
      setStatus('idle');
    }
  }

  const disabled = status === 'submitting' || !businessName.trim() || !city.trim() || !state.trim();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Create your provider profile</h1>
      <p className="mt-2 text-gray-600">Add your business details so customers can find you.</p>

      <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm mb-1">Business name *</label>
          <input className="w-full rounded-xl border px-4 py-3" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Windy City Growth" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">City *</label>
            <input className="w-full rounded-xl border px-4 py-3" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Chicago" required />
          </div>
          <div>
            <label className="block text-sm mb-1">State *</label>
            <input className="w-full rounded-xl border px-4 py-3" value={state} onChange={(e) => setState(e.target.value)} placeholder="IL" maxLength={20} required />
          </div>
          <div>
            <label className="block text-sm mb-1">ZIP</label>
            <input className="w-full rounded-xl border px-4 py-3" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="60601" />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Tagline</label>
          <input className="w-full rounded-xl border px-4 py-3" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Meta + Google Ads for local" />
        </div>

        <div>
          <label className="block text-sm mb-1">Logo URL</label>
          <input className="w-full rounded-xl border px-4 py-3" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://…/logo.png" />
          <p className="mt-1 text-xs text-gray-500">(Upload integrations come later; paste an image URL for now.)</p>
        </div>

        <div>
          <label className="block text-sm mb-2">Services</label>
          <div className="flex flex-wrap gap-3">
            {SERVICE_OPTIONS.map((opt) => (
              <label key={opt.value} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer">
                <input type="checkbox" className="h-4 w-4" checked={services.includes(opt.value)} onChange={() => toggleService(opt.value)} />
                {opt.label}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">You can edit services later in your profile.</p>
        </div>

        <button type="submit" disabled={disabled} className={`rounded-xl border px-4 py-3 font-medium ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
          {status === 'submitting' ? 'Creating…' : 'Create profile'}
        </button>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <p className="text-xs text-gray-500">* required</p>
      </form>
    </main>
  );
}

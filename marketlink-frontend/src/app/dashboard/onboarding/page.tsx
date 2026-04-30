'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const SERVICE_OPTIONS = [
  { value: 'seo', label: 'SEO' },
  { value: 'social', label: 'Social' },
  { value: 'ads', label: 'Ads' },
  { value: 'web', label: 'Websites' },
  { value: 'branding', label: 'Branding' },
  { value: 'email', label: 'Email' },
  { value: 'content', label: 'Content' },
  { value: 'video', label: 'Video' },
];

const EXPERT_TYPE_OPTIONS = [
  { value: 'agency', label: 'Agency' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'creator', label: 'Creator' },
  { value: 'specialist', label: 'Specialist' },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [expertType, setExpertType] = useState('');
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
      if (!businessName.trim()) throw new Error('Business name is required.');
      if (!city.trim()) throw new Error('City is required.');
      if (!state.trim()) throw new Error('State is required.');
      if (!expertType) throw new Error('Expert type is required.');
      if (!services.length) throw new Error('Select at least one service.');

      const res = await fetch(`${API_BASE}/experts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          businessName: businessName.trim(),
          city: city.trim(),
          state: state.trim(),
          expertType,
          services,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body?.error || `Failed (${res.status})`);
      }

      const data = await res.json();
      const slug = (data?.expert?.slug || data?.provider?.slug) as string | undefined;

      if (slug) {
        router.replace(`/experts/${slug}`);
        return;
      }

      router.replace('/dashboard');
    } catch (err: unknown) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setStatus('idle');
    }
  }

  const disabled = status === 'submitting' || !businessName.trim() || !city.trim() || !state.trim() || !expertType || services.length === 0;
  const sectionClass =
    'rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(236,242,248,0.96))] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6';
  const fieldClass =
    'w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200/70';
  const checkboxClass = 'h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200';

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_320px] lg:items-start">
        <section className={`${sectionClass} order-1`}>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Expert onboarding</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Create your expert profile</h1>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              Start with the essentials that power discovery. You can add proof, pricing, and portfolio detail in your profile editor after this.
            </p>
          </div>

          <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Business name *</label>
              <input className={fieldClass} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Windy City Growth" required />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">City *</label>
                <input className={fieldClass} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Chicago" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">State *</label>
                <input className={fieldClass} value={state} onChange={(e) => setState(e.target.value)} placeholder="IL" maxLength={20} required />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Expert type *</label>
              <select className={fieldClass} value={expertType} onChange={(e) => setExpertType(e.target.value)} required>
                <option value="">Select the best fit</option>
                {EXPERT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                {expertType === 'creator'
                  ? 'Creator proof, platform links, and audience detail can be added right after setup in your profile editor.'
                  : 'Pick the closest fit for how buyers should understand your business.'}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Services *</label>
              <div className="flex flex-wrap gap-3">
                {SERVICE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm">
                    <input type="checkbox" className={checkboxClass} checked={services.includes(opt.value)} onChange={() => toggleService(opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">These match the live discovery categories buyers already use on the homepage and expert directory.</p>
            </div>

            {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">* required</p>
              <button
                type="submit"
                disabled={disabled}
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === 'submitting' ? 'Creating...' : 'Create profile'}
              </button>
            </div>
          </form>
        </section>

        <aside className={`${sectionClass} order-2 lg:sticky lg:top-6`}>
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">What happens next</div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="text-sm font-semibold text-slate-900">1. Create the listing</div>
              <p className="mt-1 text-sm text-slate-600">Start with the fields buyers need first: business name, city, expert type, and services.</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="text-sm font-semibold text-slate-900">2. Add proof of work</div>
              <p className="mt-1 text-sm text-slate-600">After setup, use the profile editor to add case studies, clients, media, pricing, and creator proof.</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="text-sm font-semibold text-slate-900">3. Keep it focused</div>
              <p className="mt-1 text-sm text-slate-600">A clear category match and strong proof matter more than stuffing every optional field in the first step.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

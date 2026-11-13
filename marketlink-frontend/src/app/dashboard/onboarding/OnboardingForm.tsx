'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LocationAutocompleteField, { type LocationSuggestion } from '@/components/LocationAutocompleteField';
import TaxonomyServicePicker from '@/components/TaxonomyServicePicker';
import { getStateDisplayName, normalizeStateCode } from '@/lib/usStates';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const EXPERT_TYPE_OPTIONS = [
  { value: 'agency', label: 'Agency' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'creator', label: 'Creator' },
  { value: 'specialist', label: 'Specialist' },
];

export default function OnboardingForm() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [locationPrecision, setLocationPrecision] = useState('approximate');
  const [expertType, setExpertType] = useState('');
  const [services, setServices] = useState<string[]>([]);

  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const [error, setError] = useState<string | null>(null);

  function applyResolvedLocation(suggestion: LocationSuggestion) {
    if (suggestion.label) setStreetAddress(suggestion.label);
    if (suggestion.zip) setZip(suggestion.zip);
    if (suggestion.city) setCity(suggestion.city);
    if (suggestion.stateCode || suggestion.state) setState(getStateDisplayName(suggestion.stateCode || suggestion.state || ''));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    try {
      if (!businessName.trim()) throw new Error('Business name is required.');
      if (locationPrecision === 'exact' && !streetAddress.trim()) throw new Error('Enter the business address you want to publish.');
      if (!city.trim()) throw new Error('City is required.');
      if (!state.trim()) throw new Error('State is required.');
      if (!expertType) throw new Error('Expert type is required.');
      if (!services.length) throw new Error('Choose at least one help type.');

      const normalizedState = normalizeStateCode(state);
      if (!normalizedState) throw new Error('Select a valid US state.');

      const res = await fetch(`${API_BASE}/experts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          businessName: businessName.trim(),
          streetAddress: streetAddress.trim(),
          city: city.trim(),
          state: normalizedState,
          zip: zip.trim(),
          locationPrecision,
          expertType,
          services,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body?.error || `Failed (${res.status})`);
      }

      router.replace('/dashboard/profile');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setStatus('idle');
    }
  }

  const disabled = status === 'submitting';
  const fieldClass =
    'w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200/70';
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Create your expert profile</h1>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              Create your public listing. You can add pricing and examples of your work later.
            </p>
          </div>

          <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="setup-name">Business name *</label>
              <input id="setup-name" className={fieldClass} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Windy City Growth" required />
            </div>

            <div className="grid gap-4">
              <LocationAutocompleteField
                label="Business address (optional)"
                value={streetAddress}
                onChange={setStreetAddress}
                onResolve={applyResolvedLocation}
                type="address"
                placeholder="Search for a business address"
                fieldClass={fieldClass}
                autoComplete="street-address"
                helperText="Choose a suggestion to fill in city, state, and ZIP, or enter them below."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="setup-city">City *</label>
                <input id="setup-city" className={fieldClass} value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="setup-state">State *</label>
                <input id="setup-state" className={fieldClass} value={state} onChange={(e) => setState(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="setup-zip">ZIP (optional)</label>
                <input id="setup-zip" className={fieldClass} value={zip} onChange={(e) => setZip(e.target.value)} autoComplete="postal-code" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="setup-type">Expert type *</label>
              <select id="setup-type" className={fieldClass} value={expertType} onChange={(e) => setExpertType(e.target.value)} required>
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
              <label htmlFor="setup-location-display" className="mb-1 block text-sm font-medium">Public location</label>
              <select id="setup-location-display" className={fieldClass} value={locationPrecision} onChange={(event) => setLocationPrecision(event.target.value)}>
                <option value="approximate">City and state</option>
                <option value="private">Hide my location</option>
                <option value="exact">Show my exact business address</option>
              </select>
              <p className="mt-2 text-sm text-slate-600">A hidden location is excluded from nearby searches. Buyers can still find your listing by name or service.</p>
            </div>

            <div>
              <TaxonomyServicePicker services={services} onChange={setServices} required />
            </div>

            {error ? <p role="alert" tabIndex={-1} ref={(node) => { node?.focus(); }} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">* required</p>
              <button
                type="submit"
                disabled={disabled}
                className="rounded-lg bg-[#2455B5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1E489A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2455B5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === 'submitting' ? 'Creating...' : 'Create profile'}
              </button>
            </div>
          </form>
        </section>

    </main>
  );
}

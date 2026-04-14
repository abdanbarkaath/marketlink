'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Role = 'provider' | 'admin';

type ProviderStatus = 'active' | 'pending' | 'disabled';

type Provider = {
  slug: string;
  businessName: string;
  shortDescription?: string | null;
  overview?: string | null;
  websiteUrl?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  foundedYear?: number | string | null;
  hourlyRateMin?: number | string | null;
  hourlyRateMax?: number | string | null;
  minProjectBudget?: number | string | null;
  currencyCode?: string | null;
  languages: string[];
  industries: string[];
  clientSizes: string[];
  specialties: string[];
  remoteFriendly?: boolean;
  servesNationwide?: boolean;
  responseTimeHours?: number | string | null;
  city: string;
  state: string;
  zip?: string | null;
  tagline?: string | null;
  logo?: string | null;
  services: string[];
  status?: ProviderStatus; // admin only
  disabledReason?: string | null; // admin only
};

const SERVICE_OPTIONS = [
  { value: 'seo', label: 'SEO' },
  { value: 'ads', label: 'Ads' },
  { value: 'social', label: 'Social' },
  { value: 'video', label: 'Video' },
  { value: 'print', label: 'Print' },
];

export default function ProfileEditorPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const [data, setData] = useState<Provider | null>(null);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNext, setPwNext] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwOpen, setPwOpen] = useState(false);

  // Load current user's provider from /me/summary (works for active/pending/disabled)
  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch(`${API_BASE}/me/summary`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (meRes.status === 401) return router.replace('/login');

        const me = await meRes.json();
        const meRole = (me?.user?.role || 'provider') as Role;
        setRole(meRole);

        if (!me.provider) return router.replace('/dashboard/onboarding');

        const p = me.provider;

        setData({
          slug: p.slug,
          businessName: p.businessName ?? '',
          shortDescription: p.shortDescription ?? '',
          overview: p.overview ?? '',
          websiteUrl: p.websiteUrl ?? '',
          phone: p.phone ?? '',
          linkedinUrl: p.linkedinUrl ?? '',
          instagramUrl: p.instagramUrl ?? '',
          facebookUrl: p.facebookUrl ?? '',
          foundedYear: p.foundedYear ?? '',
          hourlyRateMin: p.hourlyRateMin ?? '',
          hourlyRateMax: p.hourlyRateMax ?? '',
          minProjectBudget: p.minProjectBudget ?? '',
          currencyCode: p.currencyCode ?? 'USD',
          languages: Array.isArray(p.languages) ? p.languages : [],
          industries: Array.isArray(p.industries) ? p.industries : [],
          clientSizes: Array.isArray(p.clientSizes) ? p.clientSizes : [],
          specialties: Array.isArray(p.specialties) ? p.specialties : [],
          remoteFriendly: Boolean(p.remoteFriendly),
          servesNationwide: Boolean(p.servesNationwide),
          responseTimeHours: p.responseTimeHours ?? '',
          city: p.city ?? '',
          state: String(p.state ?? ''),
          zip: p.zip ?? '',
          tagline: p.tagline ?? '',
          logo: p.logo ?? '',
          services: Array.isArray(p.services) ? p.services : [],
          status: p.status as ProviderStatus | undefined,
          disabledReason: p.disabledReason ?? '',
        });
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Warn on accidental navigation if there are unsaved edits
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty || saving) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, saving]);

  function setField<K extends keyof Provider>(key: K, val: Provider[K]) {
    if (!data) return;
    setDirty(true);
    setData({ ...data, [key]: val });
  }

  function toggleService(val: string) {
    if (!data) return;
    setDirty(true);
    const next = data.services.includes(val) ? data.services.filter((v) => v !== val) : [...data.services, val];
    setData({ ...data, services: next });
  }

  function parseTokenInput(raw: string) {
    return Array.from(
      new Set(
        raw
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      ),
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setError(null);

    try {
      const basePayload: any = {
        businessName: data.businessName.trim(),
        city: data.city.trim(),
        state: data.state.trim().toUpperCase(),
        zip: (data.zip || '').trim(),
        tagline: (data.tagline || '').trim(),
        logo: (data.logo || '').trim(),
        services: Array.from(new Set(data.services.map((s) => s.trim()).filter(Boolean))),
        shortDescription: (data.shortDescription || '').trim(),
        overview: (data.overview || '').trim(),
        websiteUrl: (data.websiteUrl || '').trim(),
        phone: (data.phone || '').trim(),
        linkedinUrl: (data.linkedinUrl || '').trim(),
        instagramUrl: (data.instagramUrl || '').trim(),
        facebookUrl: (data.facebookUrl || '').trim(),
        foundedYear: data.foundedYear ?? '',
        hourlyRateMin: data.hourlyRateMin ?? '',
        hourlyRateMax: data.hourlyRateMax ?? '',
        minProjectBudget: data.minProjectBudget ?? '',
        currencyCode: (data.currencyCode || 'USD').trim().toUpperCase(),
        languages: Array.from(new Set((data.languages || []).map((s) => s.trim().toLowerCase()).filter(Boolean))),
        industries: Array.from(new Set((data.industries || []).map((s) => s.trim().toLowerCase()).filter(Boolean))),
        clientSizes: Array.from(new Set((data.clientSizes || []).map((s) => s.trim().toLowerCase()).filter(Boolean))),
        specialties: Array.from(new Set((data.specialties || []).map((s) => s.trim().toLowerCase()).filter(Boolean))),
        remoteFriendly: Boolean(data.remoteFriendly),
        servesNationwide: Boolean(data.servesNationwide),
        responseTimeHours: data.responseTimeHours ?? '',
      };

      // Admin-only fields
      if (role === 'admin') {
        basePayload.status = data.status || 'pending';
        basePayload.disabledReason = basePayload.status === 'disabled' ? String(data.disabledReason || '').trim() : null;
      }

      const res = await fetch(`${API_BASE}/providers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(basePayload),
      });

      if (!res.ok) {
        let msg = `Save failed (${res.status})`;
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }

      const updated = await res.json(); // should include { slug }
      setDirty(false);

      // For pending/disabled, going to public page might 404, so go back to dashboard.
      router.replace('/dashboard');
    } catch (e: any) {
      setError(e?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  function resetPwForm() {
    setPwCurrent('');
    setPwNext('');
    setPwConfirm('');
    setPwMessage(null);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMessage(null);

    if (!pwCurrent || !pwNext) {
      setPwMessage('Enter your current password and a new password.');
      return;
    }
    if (pwNext.length < 8) {
      setPwMessage('New password must be at least 8 characters.');
      return;
    }
    if (pwNext !== pwConfirm) {
      setPwMessage('New password and confirmation do not match.');
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNext }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message || 'Failed to change password.');
      }

      setPwCurrent('');
      setPwNext('');
      setPwConfirm('');
      setPwMessage('Password updated.');
    } catch (e: any) {
      setPwMessage(e?.message || 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  }

  // ----- keep hooks before early returns -----
  const known = useMemo(() => new Set(SERVICE_OPTIONS.map((s) => s.value)), []);
  const extraServices = useMemo(() => (data?.services || []).filter((s) => !known.has(s)), [data?.services, known]);
  // ------------------------------------------

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p>Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-red-600">Error: {error}</p>
      </main>
    );
  }

  if (!data) return null;

  const disableSave = saving || !data.businessName.trim() || !data.city.trim() || !data.state.trim();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Edit profile</h1>
          <p className="mt-2 text-gray-600">Update your provider details.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPwOpen(true)} className="rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-gray-50">
            Change password
          </button>
          <button type="button" onClick={() => router.replace('/dashboard')} className="rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-gray-50">
            Back to dashboard
          </button>
        </div>
      </div>

      {/* Admin-only moderation controls */}
      {role === 'admin' ? (
        <section className="mt-6 rounded-2xl border bg-gray-50 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Admin controls</h2>
            <span className="text-xs text-gray-500">Visibility is controlled by status</span>
          </div>

          <div className="mt-4 grid gap-4">
            <div>
              <label className="mb-1 block text-sm">Status</label>
              <select className="w-full rounded-xl border px-3 py-2" value={data.status || 'pending'} onChange={(e) => setField('status', e.target.value as ProviderStatus)}>
                <option value="active">Active (visible in search)</option>
                <option value="pending">Pending (hidden)</option>
                <option value="disabled">Disabled (hidden)</option>
              </select>
            </div>

            {(data.status || 'pending') === 'disabled' ? (
              <div>
                <label className="mb-1 block text-sm">Disabled reason (optional)</label>
                <input
                  className="w-full rounded-xl border px-4 py-3"
                  value={data.disabledReason ?? ''}
                  onChange={(e) => setField('disabledReason', e.target.value)}
                  placeholder="e.g., duplicate listing / policy violation / requested by owner"
                />
              </div>
            ) : null}
          </div>

          <p className="mt-3 text-xs text-gray-500">Note: pending/disabled providers may 404 on the public page by design.</p>
        </section>
      ) : null}

      <form onSubmit={handleSave} className="mt-8 grid gap-5">
        <div>
          <label className="mb-1 block text-sm">Business name *</label>
          <input autoComplete="organization" className="w-full rounded-xl border px-4 py-3" value={data.businessName} onChange={(e) => setField('businessName', e.target.value)} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm">City *</label>
            <input autoComplete="address-level2" className="w-full rounded-xl border px-4 py-3" value={data.city} onChange={(e) => setField('city', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">State *</label>
            <input autoComplete="address-level1" className="w-full rounded-xl border px-4 py-3" value={data.state} onChange={(e) => setField('state', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">ZIP</label>
            <input autoComplete="postal-code" className="w-full rounded-xl border px-4 py-3" value={data.zip ?? ''} onChange={(e) => setField('zip', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm">Tagline</label>
          <input className="w-full rounded-xl border px-4 py-3" value={data.tagline ?? ''} onChange={(e) => setField('tagline', e.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-sm">Short description</label>
          <input className="w-full rounded-xl border px-4 py-3" value={data.shortDescription ?? ''} onChange={(e) => setField('shortDescription', e.target.value)} placeholder="One line summary for cards" />
        </div>

        <div>
          <label className="mb-1 block text-sm">Overview</label>
          <textarea className="w-full rounded-xl border px-4 py-3 min-h-[120px]" value={data.overview ?? ''} onChange={(e) => setField('overview', e.target.value)} placeholder="Describe your agency, focus areas, and approach." />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Website</label>
            <input autoComplete="url" className="w-full rounded-xl border px-4 py-3" value={data.websiteUrl ?? ''} onChange={(e) => setField('websiteUrl', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="mb-1 block text-sm">Phone</label>
            <input autoComplete="tel" className="w-full rounded-xl border px-4 py-3" value={data.phone ?? ''} onChange={(e) => setField('phone', e.target.value)} placeholder="(555) 123-4567" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm">LinkedIn</label>
            <input autoComplete="url" className="w-full rounded-xl border px-4 py-3" value={data.linkedinUrl ?? ''} onChange={(e) => setField('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/company/..." />
          </div>
          <div>
            <label className="mb-1 block text-sm">Instagram</label>
            <input autoComplete="url" className="w-full rounded-xl border px-4 py-3" value={data.instagramUrl ?? ''} onChange={(e) => setField('instagramUrl', e.target.value)} placeholder="https://instagram.com/..." />
          </div>
          <div>
            <label className="mb-1 block text-sm">Facebook</label>
            <input autoComplete="url" className="w-full rounded-xl border px-4 py-3" value={data.facebookUrl ?? ''} onChange={(e) => setField('facebookUrl', e.target.value)} placeholder="https://facebook.com/..." />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Founded year</label>
            <input type="number" className="w-full rounded-xl border px-4 py-3" value={data.foundedYear ?? ''} onChange={(e) => setField('foundedYear', e.target.value)} placeholder="e.g. 2015" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm">Logo URL</label>
          <input autoComplete="url" className="w-full rounded-xl border px-4 py-3" value={data.logo ?? ''} onChange={(e) => setField('logo', e.target.value)} placeholder="https://..." />
          {data.logo?.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.logo} alt="Logo preview" className="mt-2 h-16 w-16 rounded-xl border object-cover" />
          ) : null}
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold">Pricing</div>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Hourly rate min</label>
              <input type="number" className="w-full rounded-xl border px-4 py-3" value={data.hourlyRateMin ?? ''} onChange={(e) => setField('hourlyRateMin', e.target.value)} placeholder="e.g. 75" />
            </div>
            <div>
              <label className="mb-1 block text-sm">Hourly rate max</label>
              <input type="number" className="w-full rounded-xl border px-4 py-3" value={data.hourlyRateMax ?? ''} onChange={(e) => setField('hourlyRateMax', e.target.value)} placeholder="e.g. 150" />
            </div>
            <div>
              <label className="mb-1 block text-sm">Min project budget</label>
              <input type="number" className="w-full rounded-xl border px-4 py-3" value={data.minProjectBudget ?? ''} onChange={(e) => setField('minProjectBudget', e.target.value)} placeholder="e.g. 5000" />
            </div>
            <div>
              <label className="mb-1 block text-sm">Currency</label>
              <input className="w-full rounded-xl border px-4 py-3" value={data.currencyCode ?? 'USD'} onChange={(e) => setField('currencyCode', e.target.value)} placeholder="USD" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Languages (comma separated)</label>
            <input className="w-full rounded-xl border px-4 py-3" value={(data.languages || []).join(', ')} onChange={(e) => setField('languages', parseTokenInput(e.target.value))} placeholder="english, spanish" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Industries (comma separated)</label>
            <input className="w-full rounded-xl border px-4 py-3" value={(data.industries || []).join(', ')} onChange={(e) => setField('industries', parseTokenInput(e.target.value))} placeholder="healthcare, retail" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Client sizes (comma separated)</label>
            <input className="w-full rounded-xl border px-4 py-3" value={(data.clientSizes || []).join(', ')} onChange={(e) => setField('clientSizes', parseTokenInput(e.target.value))} placeholder="smb, enterprise" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Specialties (comma separated)</label>
            <input className="w-full rounded-xl border px-4 py-3" value={(data.specialties || []).join(', ')} onChange={(e) => setField('specialties', parseTokenInput(e.target.value))} placeholder="lead gen, ecommerce" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(data.remoteFriendly)} onChange={(e) => setField('remoteFriendly', e.target.checked)} />
            Remote friendly
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(data.servesNationwide)} onChange={(e) => setField('servesNationwide', e.target.checked)} />
            Serves nationwide
          </label>
          <div>
            <label className="mb-1 block text-sm">Response time (hours)</label>
            <input type="number" className="w-full rounded-xl border px-4 py-3" value={data.responseTimeHours ?? ''} onChange={(e) => setField('responseTimeHours', e.target.value)} placeholder="e.g. 24" />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm">Services</label>
          <div className="flex flex-wrap gap-3">
            {SERVICE_OPTIONS.map((opt) => (
              <label key={opt.value} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                <input type="checkbox" className="h-4 w-4" checked={data.services.includes(opt.value)} onChange={() => toggleService(opt.value)} />
                {opt.label}
              </label>
            ))}
          </div>

          {extraServices.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-gray-500">Other services already on your profile</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {extraServices.map((s) => (
                  <span key={s} className="rounded-full border bg-gray-50 px-2 py-1 text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={disableSave} className={`rounded-xl border px-4 py-3 font-medium ${disableSave ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50'}`}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>

        <p className="text-xs text-gray-500">* required</p>
      </form>


      {pwOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Change password</h2>
              <button
                type="button"
                onClick={() => {
                  setPwOpen(false);
                  resetPwForm();
                }}
                className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="mt-4 grid gap-4">
              <div>
                <label className="mb-1 block text-sm">Current password</label>
                <input type="password" autoComplete="current-password" className="w-full rounded-xl border px-4 py-3" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm">New password</label>
                <input type="password" autoComplete="new-password" className="w-full rounded-xl border px-4 py-3" value={pwNext} onChange={(e) => setPwNext(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Confirm new password</label>
                <input type="password" autoComplete="new-password" className="w-full rounded-xl border px-4 py-3" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} />
              </div>

              <div className="flex items-center justify-between">
                <button type="submit" disabled={pwSaving} className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${pwSaving ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50'}`}>
                  {pwSaving ? 'Updating...' : 'Update password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPwOpen(false);
                    resetPwForm();
                  }}
                  className="rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>

              {pwMessage ? <p className="text-sm text-gray-600">{pwMessage}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Role = 'provider' | 'admin';

type ProviderStatus = 'active' | 'pending' | 'disabled';

type Provider = {
  slug: string;
  businessName: string;
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
      <h1 className="text-2xl font-semibold">Edit profile</h1>
      <p className="mt-2 text-gray-600">Update your provider details.</p>

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
          <label className="mb-1 block text-sm">Logo URL</label>
          <input autoComplete="url" className="w-full rounded-xl border px-4 py-3" value={data.logo ?? ''} onChange={(e) => setField('logo', e.target.value)} placeholder="https://..." />
          {data.logo?.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.logo} alt="Logo preview" className="mt-2 h-16 w-16 rounded-xl border object-cover" />
          ) : null}
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
            {saving ? 'Saving…' : 'Save changes'}
          </button>

          <button type="button" onClick={() => router.replace('/dashboard')} className="rounded-xl border px-4 py-3 font-medium hover:bg-gray-50">
            Back to dashboard
          </button>

          {data.status === 'active' ? (
            <button type="button" onClick={() => router.replace(`/providers/${data.slug}`)} className="rounded-xl border px-4 py-3 font-medium hover:bg-gray-50">
              View public page
            </button>
          ) : null}
        </div>

        <p className="text-xs text-gray-500">* required</p>
      </form>
    </main>
  );
}

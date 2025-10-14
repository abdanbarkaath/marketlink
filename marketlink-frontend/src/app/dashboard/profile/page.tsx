'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Provider = {
  slug: string;
  businessName: string;
  city: string;
  state: string;
  zip?: string | null;
  tagline?: string | null;
  logo?: string | null;
  services: string[];
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<Provider | null>(null);

  // Load the logged-in user's provider (redirect if not logged in / no provider)
  useEffect(() => {
    (async () => {
      try {
        // 1) who am I + do I own a provider?
        const meRes = await fetch(`${API_BASE}/me/summary`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (meRes.status === 401) return router.replace('/login');
        const me = await meRes.json();
        if (!me.provider) return router.replace('/dashboard/onboarding');

        // 2) load full provider by slug
        const pRes = await fetch(`${API_BASE}/providers/${me.provider.slug}`, {
          cache: 'no-store',
        });
        if (!pRes.ok) throw new Error(`Failed to load provider (${pRes.status})`);
        const p = await pRes.json();
        setData({
          slug: p.slug,
          businessName: p.businessName ?? '',
          city: p.city ?? '',
          state: p.state ?? '',
          zip: p.zip ?? '',
          tagline: p.tagline ?? '',
          logo: p.logo ?? '',
          services: Array.isArray(p.services) ? p.services : [],
        });
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function toggleService(val: string) {
    if (!data) return;
    const next = data.services.includes(val) ? data.services.filter((v) => v !== val) : [...data.services, val];
    setData({ ...data, services: next });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/providers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          businessName: data.businessName,
          city: data.city,
          state: data.state,
          zip: data.zip || '',
          tagline: data.tagline || '',
          logo: data.logo || '',
          services: data.services,
        }),
      });
      console.log('res', res);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Save failed (${res.status})`);
      }
      // after save, bounce to public page
      router.replace(`/providers/${data.slug}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

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
      <p className="mt-2 text-gray-600">Update your public provider details.</p>

      <form onSubmit={handleSave} className="mt-8 grid gap-5">
        <div>
          <label className="block text-sm mb-1">Business name *</label>
          <input className="w-full rounded-xl border px-4 py-3" value={data.businessName} onChange={(e) => setData({ ...data, businessName: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">City *</label>
            <input className="w-full rounded-xl border px-4 py-3" value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm mb-1">State *</label>
            <input className="w-full rounded-xl border px-4 py-3" value={data.state} onChange={(e) => setData({ ...data, state: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm mb-1">ZIP</label>
            <input className="w-full rounded-xl border px-4 py-3" value={data.zip ?? ''} onChange={(e) => setData({ ...data, zip: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Tagline</label>
          <input className="w-full rounded-xl border px-4 py-3" value={data.tagline ?? ''} onChange={(e) => setData({ ...data, tagline: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm mb-1">Logo URL</label>
          <input className="w-full rounded-xl border px-4 py-3" value={data.logo ?? ''} onChange={(e) => setData({ ...data, logo: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm mb-2">Services</label>
          <div className="flex flex-wrap gap-3">
            {SERVICE_OPTIONS.map((opt) => (
              <label key={opt.value} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer">
                <input type="checkbox" className="h-4 w-4" checked={data.services.includes(opt.value)} onChange={() => toggleService(opt.value)} />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={disableSave} className={`rounded-xl border px-4 py-3 font-medium ${disableSave ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={() => router.replace(`/providers/${data.slug}`)} className="rounded-xl border px-4 py-3 font-medium hover:bg-gray-50">
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-500">* required</p>
      </form>
    </main>
  );
}

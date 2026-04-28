'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Role = 'provider' | 'admin';

type ProviderStatus = 'active' | 'pending' | 'disabled';

type MediaType = 'logo' | 'cover' | 'gallery' | 'video';

type ProviderProject = {
  id?: string;
  title: string;
  summary?: string | null;
  challenge?: string | null;
  solution?: string | null;
  results?: string | null;
  services: string[];
  projectBudget?: number | string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  isFeatured?: boolean;
  coverImageUrl?: string | null;
  sortOrder?: number;
};

type ProviderClient = {
  id?: string;
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  isFeatured?: boolean;
  sortOrder?: number;
};

type ProviderMedia = {
  id?: string;
  type: MediaType;
  url: string;
  altText?: string | null;
  sortOrder?: number;
};

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
  projects: ProviderProject[];
  clients: ProviderClient[];
  media: ProviderMedia[];
  status?: ProviderStatus; // admin only
  disabledReason?: string | null; // admin only
};

type MeSummaryResponse = {
  user?: { role?: Role };
  expert?: Partial<Provider> & {
    projects?: Array<Partial<ProviderProject>>;
    clients?: Array<Partial<ProviderClient>>;
    media?: Array<Partial<ProviderMedia>>;
  };
  provider?: Partial<Provider> & {
    projects?: Array<Partial<ProviderProject>>;
    clients?: Array<Partial<ProviderClient>>;
    media?: Array<Partial<ProviderMedia>>;
  };
};

const SERVICE_OPTIONS = [
  { value: 'seo', label: 'SEO' },
  { value: 'ads', label: 'Ads' },
  { value: 'social', label: 'Social' },
  { value: 'video', label: 'Video' },
  { value: 'print', label: 'Print' },
];

const MEDIA_TYPE_OPTIONS: Array<{ value: MediaType; label: string }> = [
  { value: 'cover', label: 'Cover' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'video', label: 'Video' },
  { value: 'logo', label: 'Logo' },
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
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [clientsOpen, setClientsOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  // Load current user's provider from /me/summary (works for active/pending/disabled)
  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch(`${API_BASE}/me/summary`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (meRes.status === 401) return router.replace('/login');

        const me = (await meRes.json()) as MeSummaryResponse;
        const meRole = (me?.user?.role || 'provider') as Role;
        setRole(meRole);

        const p = me.expert ?? me.provider;
        if (!p) return router.replace('/dashboard/onboarding');

        setData({
          slug: p.slug ?? '',
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
          projects: Array.isArray(p.projects)
            ? p.projects.map((project, index: number) => ({
                id: project.id,
                title: project.title ?? '',
                summary: project.summary ?? '',
                challenge: project.challenge ?? '',
                solution: project.solution ?? '',
                results: project.results ?? '',
                services: Array.isArray(project.services) ? project.services : [],
                projectBudget: project.projectBudget ?? '',
                startedAt: project.startedAt ? String(project.startedAt).slice(0, 10) : '',
                completedAt: project.completedAt ? String(project.completedAt).slice(0, 10) : '',
                isFeatured: Boolean(project.isFeatured),
                coverImageUrl: project.coverImageUrl ?? '',
                sortOrder: typeof project.sortOrder === 'number' ? project.sortOrder : index,
              }))
            : [],
          clients: Array.isArray(p.clients)
            ? p.clients.map((client, index: number) => ({
                id: client.id,
                name: client.name ?? '',
                logoUrl: client.logoUrl ?? '',
                websiteUrl: client.websiteUrl ?? '',
                isFeatured: Boolean(client.isFeatured),
                sortOrder: typeof client.sortOrder === 'number' ? client.sortOrder : index,
              }))
            : [],
          media: Array.isArray(p.media)
            ? p.media.map((item, index: number) => ({
                id: item.id,
                type: (item.type || 'gallery') as MediaType,
                url: item.url ?? '',
                altText: item.altText ?? '',
                sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index,
              }))
            : [],
          status: p.status as ProviderStatus | undefined,
          disabledReason: p.disabledReason ?? '',
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load profile');
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

  function setProjectField(index: number, key: keyof ProviderProject, value: ProviderProject[keyof ProviderProject]) {
    if (!data) return;
    setDirty(true);
    const projects = [...data.projects];
    projects[index] = { ...projects[index], [key]: value };
    setData({ ...data, projects });
  }

  function addProject() {
    if (!data) return;
    setDirty(true);
    setData({
      ...data,
      projects: [
        ...data.projects,
        {
          title: '',
          summary: '',
          challenge: '',
          solution: '',
          results: '',
          services: [],
          projectBudget: '',
          startedAt: '',
          completedAt: '',
          isFeatured: false,
          coverImageUrl: '',
          sortOrder: data.projects.length,
        },
      ],
    });
  }

  function removeProject(index: number) {
    if (!data) return;
    setDirty(true);
    setData({
      ...data,
      projects: data.projects.filter((_, itemIndex) => itemIndex !== index).map((item, itemIndex) => ({ ...item, sortOrder: itemIndex })),
    });
  }

  function setClientField(index: number, key: keyof ProviderClient, value: ProviderClient[keyof ProviderClient]) {
    if (!data) return;
    setDirty(true);
    const clients = [...data.clients];
    clients[index] = { ...clients[index], [key]: value };
    setData({ ...data, clients });
  }

  function addClient() {
    if (!data) return;
    setDirty(true);
    setData({
      ...data,
      clients: [
        ...data.clients,
        {
          name: '',
          logoUrl: '',
          websiteUrl: '',
          isFeatured: false,
          sortOrder: data.clients.length,
        },
      ],
    });
  }

  function removeClient(index: number) {
    if (!data) return;
    setDirty(true);
    setData({
      ...data,
      clients: data.clients.filter((_, itemIndex) => itemIndex !== index).map((item, itemIndex) => ({ ...item, sortOrder: itemIndex })),
    });
  }

  function setMediaField(index: number, key: keyof ProviderMedia, value: ProviderMedia[keyof ProviderMedia]) {
    if (!data) return;
    setDirty(true);
    const media = [...data.media];
    media[index] = { ...media[index], [key]: value };
    setData({ ...data, media });
  }

  function addMedia() {
    if (!data) return;
    setDirty(true);
    setData({
      ...data,
      media: [
        ...data.media,
        {
          type: 'gallery',
          url: '',
          altText: '',
          sortOrder: data.media.length,
        },
      ],
    });
  }

  function removeMedia(index: number) {
    if (!data) return;
    setDirty(true);
    setData({
      ...data,
      media: data.media.filter((_, itemIndex) => itemIndex !== index).map((item, itemIndex) => ({ ...item, sortOrder: itemIndex })),
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setError(null);

    try {
      const basePayload: Record<string, unknown> = {
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
        projects: data.projects.map((project, index) => ({
          title: project.title.trim(),
          summary: (project.summary || '').trim(),
          challenge: (project.challenge || '').trim(),
          solution: (project.solution || '').trim(),
          results: (project.results || '').trim(),
          services: Array.from(new Set((project.services || []).map((s) => s.trim().toLowerCase()).filter(Boolean))),
          projectBudget: project.projectBudget ?? '',
          startedAt: project.startedAt || '',
          completedAt: project.completedAt || '',
          isFeatured: Boolean(project.isFeatured),
          coverImageUrl: (project.coverImageUrl || '').trim(),
          sortOrder: index,
        })),
        clients: data.clients.map((client, index) => ({
          name: client.name.trim(),
          logoUrl: (client.logoUrl || '').trim(),
          websiteUrl: (client.websiteUrl || '').trim(),
          isFeatured: Boolean(client.isFeatured),
          sortOrder: index,
        })),
        media: data.media.map((item, index) => ({
          type: item.type,
          url: item.url.trim(),
          altText: (item.altText || '').trim(),
          sortOrder: index,
        })),
      };

      // Admin-only fields
      if (role === 'admin') {
        basePayload.status = data.status || 'pending';
        basePayload.disabledReason = basePayload.status === 'disabled' ? String(data.disabledReason || '').trim() : null;
      }

      const res = await fetch(`${API_BASE}/experts`, {
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

      await res.json();
      setDirty(false);

      // For pending/disabled, going to public page might 404, so go back to dashboard.
      router.replace('/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save changes');
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

      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        throw new Error(body?.message || 'Failed to change password.');
      }

      setPwCurrent('');
      setPwNext('');
      setPwConfirm('');
      setPwMessage('Password updated.');
    } catch (e: unknown) {
      setPwMessage(e instanceof Error ? e.message : 'Failed to change password.');
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
  const sectionClass = 'rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.92))] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6';
  const fieldClass =
    'w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200/70';
  const checkboxClass = 'h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200';
  const subtleButtonClass =
    'rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50';
  const primaryButtonClass =
    'rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.92))] shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <div className="px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Provider workspace</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Edit profile</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Update the parts buyers notice first: positioning, services, contact details, and proof of work.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-slate-700 shadow-sm">
                {dirty ? 'Unsaved changes' : 'Up to date'}
              </span>
              <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-slate-700 shadow-sm">
                Status: {role === 'admin' ? data.status || 'pending' : 'owner editor'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => setPwOpen(true)} className="rounded-full border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
              Change password
            </button>
            <button type="button" onClick={() => router.replace('/dashboard')} className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
              Back to dashboard
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Business</div>
            <div className="mt-2 text-base font-semibold text-slate-900">{data.businessName || 'Your provider name'}</div>
            <div className="mt-1 text-sm text-slate-600">
              {[data.city, data.state].filter(Boolean).join(', ') || 'Location not set'}
            </div>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Core profile</div>
            <div className="mt-2 text-sm text-slate-600">{data.shortDescription?.trim() || 'Add a short description for cards and search results.'}</div>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Proof of work</div>
            <div className="mt-2 text-sm text-slate-600">
              {data.projects.length} case studies, {data.clients.length} clients, {data.media.length} media items
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Admin-only moderation controls */}
      {role === 'admin' ? (
        <section className={`${sectionClass} mt-5`}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Admin controls</h2>
            <span className="text-xs text-slate-500">Visibility is controlled by status</span>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select className={fieldClass} value={data.status || 'pending'} onChange={(e) => setField('status', e.target.value as ProviderStatus)}>
                <option value="active">Active (visible in search)</option>
                <option value="pending">Pending (hidden)</option>
                <option value="disabled">Disabled (hidden)</option>
              </select>
            </div>

            {(data.status || 'pending') === 'disabled' ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Disabled reason (optional)</label>
                <input
                  className={fieldClass}
                  value={data.disabledReason ?? ''}
                  onChange={(e) => setField('disabledReason', e.target.value)}
                  placeholder="e.g., duplicate listing / policy violation / requested by owner"
                />
              </div>
            ) : null}
          </div>

          <p className="mt-3 text-xs text-slate-500">Pending and disabled providers may 404 on the public page by design.</p>
        </section>
      ) : null}

      <form id="profile-editor-form" onSubmit={handleSave} className="mt-5 grid gap-5 pb-24 md:pb-8">
        <section className={sectionClass}>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-slate-900">Identity and location</h2>
            <p className="text-sm text-slate-500">Keep the top-level profile information crisp. This is what shapes first impressions.</p>
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Business name *</label>
              <input autoComplete="organization" className={fieldClass} value={data.businessName} onChange={(e) => setField('businessName', e.target.value)} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">City *</label>
                <input autoComplete="address-level2" className={fieldClass} value={data.city} onChange={(e) => setField('city', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">State *</label>
                <input autoComplete="address-level1" className={fieldClass} value={data.state} onChange={(e) => setField('state', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">ZIP</label>
                <input autoComplete="postal-code" className={fieldClass} value={data.zip ?? ''} onChange={(e) => setField('zip', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tagline</label>
              <input className={fieldClass} value={data.tagline ?? ''} onChange={(e) => setField('tagline', e.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Short description</label>
              <input className={fieldClass} value={data.shortDescription ?? ''} onChange={(e) => setField('shortDescription', e.target.value)} placeholder="One line summary for cards" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Overview</label>
              <textarea className={`${fieldClass} min-h-[144px]`} value={data.overview ?? ''} onChange={(e) => setField('overview', e.target.value)} placeholder="Describe your agency, focus areas, and approach." />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Logo URL</label>
              <input autoComplete="url" className={fieldClass} value={data.logo ?? ''} onChange={(e) => setField('logo', e.target.value)} placeholder="https://..." />
              {data.logo?.trim() ? (
                <div className="mt-3 inline-flex items-center gap-3 rounded-[22px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] px-3 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.logo} alt="Logo preview" className="h-14 w-14 rounded-xl border border-slate-200/80 object-cover" />
                  <div className="text-sm text-slate-600">Logo preview</div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-slate-900">Contact and presence</h2>
            <p className="text-sm text-slate-500">Make the direct contact paths easy and trustworthy.</p>
          </div>

          <div className="mt-5 grid gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Website</label>
                <input autoComplete="url" className={fieldClass} value={data.websiteUrl ?? ''} onChange={(e) => setField('websiteUrl', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                <input autoComplete="tel" className={fieldClass} value={data.phone ?? ''} onChange={(e) => setField('phone', e.target.value)} placeholder="(555) 123-4567" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">LinkedIn</label>
                <input autoComplete="url" className={fieldClass} value={data.linkedinUrl ?? ''} onChange={(e) => setField('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/company/..." />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Instagram</label>
                <input autoComplete="url" className={fieldClass} value={data.instagramUrl ?? ''} onChange={(e) => setField('instagramUrl', e.target.value)} placeholder="https://instagram.com/..." />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Facebook</label>
                <input autoComplete="url" className={fieldClass} value={data.facebookUrl ?? ''} onChange={(e) => setField('facebookUrl', e.target.value)} placeholder="https://facebook.com/..." />
              </div>
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-slate-900">Pricing and fit</h2>
            <p className="text-sm text-slate-500">Give buyers enough structure to understand fit without overwhelming them.</p>
          </div>

          <div className="mt-5 grid gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Founded year</label>
                <input type="number" className={fieldClass} value={data.foundedYear ?? ''} onChange={(e) => setField('foundedYear', e.target.value)} placeholder="e.g. 2015" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Response time (hours)</label>
                <input type="number" className={fieldClass} value={data.responseTimeHours ?? ''} onChange={(e) => setField('responseTimeHours', e.target.value)} placeholder="e.g. 24" />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="text-sm font-semibold text-slate-900">Pricing</div>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Hourly rate min</label>
                  <input type="number" className={fieldClass} value={data.hourlyRateMin ?? ''} onChange={(e) => setField('hourlyRateMin', e.target.value)} placeholder="e.g. 75" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Hourly rate max</label>
                  <input type="number" className={fieldClass} value={data.hourlyRateMax ?? ''} onChange={(e) => setField('hourlyRateMax', e.target.value)} placeholder="e.g. 150" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Min project budget</label>
                  <input type="number" className={fieldClass} value={data.minProjectBudget ?? ''} onChange={(e) => setField('minProjectBudget', e.target.value)} placeholder="e.g. 5000" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
                  <input className={fieldClass} value={data.currencyCode ?? 'USD'} onChange={(e) => setField('currencyCode', e.target.value)} placeholder="USD" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Languages (comma separated)</label>
                <input className={fieldClass} value={(data.languages || []).join(', ')} onChange={(e) => setField('languages', parseTokenInput(e.target.value))} placeholder="english, spanish" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Industries (comma separated)</label>
                <input className={fieldClass} value={(data.industries || []).join(', ')} onChange={(e) => setField('industries', parseTokenInput(e.target.value))} placeholder="healthcare, retail" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Client sizes (comma separated)</label>
                <input className={fieldClass} value={(data.clientSizes || []).join(', ')} onChange={(e) => setField('clientSizes', parseTokenInput(e.target.value))} placeholder="smb, enterprise" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Specialties (comma separated)</label>
                <input className={fieldClass} value={(data.specialties || []).join(', ')} onChange={(e) => setField('specialties', parseTokenInput(e.target.value))} placeholder="lead gen, ecommerce" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" className={checkboxClass} checked={Boolean(data.remoteFriendly)} onChange={(e) => setField('remoteFriendly', e.target.checked)} />
                Remote friendly
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" className={checkboxClass} checked={Boolean(data.servesNationwide)} onChange={(e) => setField('servesNationwide', e.target.checked)} />
                Serves nationwide
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Services</label>
              <div className="flex flex-wrap gap-3">
                {SERVICE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] px-4 py-2.5 text-sm text-slate-700">
                    <input type="checkbox" className={checkboxClass} checked={data.services.includes(opt.value)} onChange={() => toggleService(opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>

              {extraServices.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Other services already on your profile</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {extraServices.map((s) => (
                      <span key={s} className="rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="flex items-center justify-between gap-4">
            <button type="button" onClick={() => setProjectsOpen((open) => !open)} className="flex flex-1 items-center justify-between text-left md:pointer-events-none">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Case studies</h2>
                <p className="mt-1 text-sm text-slate-500">Show real projects with budget, services, and outcomes.</p>
              </div>
              <span className="ml-4 rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm md:hidden">
                {projectsOpen ? 'Hide' : 'Show'}
              </span>
            </button>
            <button type="button" onClick={addProject} className={`${subtleButtonClass} hidden md:inline-flex`}>
              Add case study
            </button>
          </div>

          <div className="mt-4 md:hidden">
            <button type="button" onClick={addProject} className={`${subtleButtonClass} w-full justify-center`}>
              Add case study
            </button>
          </div>

          <div className={`mt-4 ${projectsOpen ? 'grid gap-4' : 'hidden'} md:grid md:gap-4`}>
            {data.projects.length ? (
              data.projects.map((project, index) => (
                <div key={project.id || index} className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-medium text-slate-800">Project {index + 1}</div>
                    <button type="button" onClick={() => removeProject(index)} className="rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
                      <input className={fieldClass} value={project.title} onChange={(e) => setProjectField(index, 'title', e.target.value)} placeholder="Paid search rebuild for regional clinic" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Summary</label>
                      <textarea className={`${fieldClass} min-h-[96px]`} value={project.summary ?? ''} onChange={(e) => setProjectField(index, 'summary', e.target.value)} placeholder="What was the project and why did it matter?" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Challenge</label>
                        <textarea className={`${fieldClass} min-h-[96px]`} value={project.challenge ?? ''} onChange={(e) => setProjectField(index, 'challenge', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Solution</label>
                        <textarea className={`${fieldClass} min-h-[96px]`} value={project.solution ?? ''} onChange={(e) => setProjectField(index, 'solution', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Results</label>
                      <textarea className={`${fieldClass} min-h-[96px]`} value={project.results ?? ''} onChange={(e) => setProjectField(index, 'results', e.target.value)} placeholder="List measurable outcomes or a concise win summary." />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Project services (comma separated)</label>
                        <input className={fieldClass} value={(project.services || []).join(', ')} onChange={(e) => setProjectField(index, 'services', parseTokenInput(e.target.value))} placeholder="ads, seo" />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Project budget</label>
                        <input type="number" className={fieldClass} value={project.projectBudget ?? ''} onChange={(e) => setProjectField(index, 'projectBudget', e.target.value)} placeholder="e.g. 12000" />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Started at</label>
                        <input type="date" className={fieldClass} value={project.startedAt ?? ''} onChange={(e) => setProjectField(index, 'startedAt', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Completed at</label>
                        <input type="date" className={fieldClass} value={project.completedAt ?? ''} onChange={(e) => setProjectField(index, 'completedAt', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Cover image URL</label>
                        <input className={fieldClass} value={project.coverImageUrl ?? ''} onChange={(e) => setProjectField(index, 'coverImageUrl', e.target.value)} placeholder="https://..." />
                      </div>
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-700 sm:mt-7">
                        <input type="checkbox" className={checkboxClass} checked={Boolean(project.isFeatured)} onChange={(e) => setProjectField(index, 'isFeatured', e.target.checked)} />
                        Featured case study
                      </label>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No case studies yet.</div>
            )}
          </div>
        </section>

        <section className={sectionClass}>
          <div className="flex items-center justify-between gap-4">
            <button type="button" onClick={() => setClientsOpen((open) => !open)} className="flex flex-1 items-center justify-between text-left md:pointer-events-none">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Featured clients</h2>
                <p className="mt-1 text-sm text-slate-500">Add client logos or names to build trust quickly.</p>
              </div>
              <span className="ml-4 rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm md:hidden">
                {clientsOpen ? 'Hide' : 'Show'}
              </span>
            </button>
            <button type="button" onClick={addClient} className={`${subtleButtonClass} hidden md:inline-flex`}>
              Add client
            </button>
          </div>

          <div className="mt-4 md:hidden">
            <button type="button" onClick={addClient} className={`${subtleButtonClass} w-full justify-center`}>
              Add client
            </button>
          </div>

          <div className={`mt-4 ${clientsOpen ? 'grid gap-4' : 'hidden'} md:grid md:gap-4`}>
            {data.clients.length ? (
              data.clients.map((client, index) => (
                <div key={client.id || index} className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-medium text-slate-800">Client {index + 1}</div>
                    <button type="button" onClick={() => removeClient(index)} className="rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Client name</label>
                      <input className={fieldClass} value={client.name} onChange={(e) => setClientField(index, 'name', e.target.value)} placeholder="Acme Health" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Website URL</label>
                      <input className={fieldClass} value={client.websiteUrl ?? ''} onChange={(e) => setClientField(index, 'websiteUrl', e.target.value)} placeholder="https://..." />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Logo URL</label>
                      <input className={fieldClass} value={client.logoUrl ?? ''} onChange={(e) => setClientField(index, 'logoUrl', e.target.value)} placeholder="https://..." />
                    </div>
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-700 sm:mt-7">
                      <input type="checkbox" className={checkboxClass} checked={Boolean(client.isFeatured)} onChange={(e) => setClientField(index, 'isFeatured', e.target.checked)} />
                      Featured client
                    </label>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No featured clients yet.</div>
            )}
          </div>
        </section>

        <section className={sectionClass}>
          <div className="flex items-center justify-between gap-4">
            <button type="button" onClick={() => setMediaOpen((open) => !open)} className="flex flex-1 items-center justify-between text-left md:pointer-events-none">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Media gallery</h2>
                <p className="mt-1 text-sm text-slate-500">Add image URLs, Instagram links, or website URLs for embedded showcases.</p>
              </div>
              <span className="ml-4 rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm md:hidden">
                {mediaOpen ? 'Hide' : 'Show'}
              </span>
            </button>
            <button type="button" onClick={addMedia} className={`${subtleButtonClass} hidden md:inline-flex`}>
              Add media
            </button>
          </div>

          <div className="mt-4 md:hidden">
            <button type="button" onClick={addMedia} className={`${subtleButtonClass} w-full justify-center`}>
              Add media
            </button>
          </div>

          <div className={`mt-4 ${mediaOpen ? 'grid gap-4' : 'hidden'} md:grid md:gap-4`}>
            {data.media.length ? (
              data.media.map((item, index) => (
                <div key={item.id || index} className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-medium text-slate-800">Media item {index + 1}</div>
                    <button type="button" onClick={() => removeMedia(index)} className="rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
                      <select className={fieldClass} value={item.type} onChange={(e) => setMediaField(index, 'type', e.target.value as MediaType)}>
                        {MEDIA_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">URL</label>
                      <input className={fieldClass} value={item.url} onChange={(e) => setMediaField(index, 'url', e.target.value)} placeholder="https://instagram.com/... or https://your-site.com" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700">Alt text</label>
                      <input className={fieldClass} value={item.altText ?? ''} onChange={(e) => setMediaField(index, 'altText', e.target.value)} placeholder="Describe what this media shows." />
                    </div>
                    <div className="sm:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs text-slate-500">
                      Supported embeds: Instagram posts/reels and website previews when the site allows it.
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No media items yet.</div>
            )}
          </div>
        </section>

        <div className="hidden md:flex md:flex-wrap md:items-center md:justify-between md:gap-4">
          <p className="text-sm text-slate-500">Changes save to your live provider profile after validation.</p>
          <button type="submit" disabled={disableSave} className={primaryButtonClass}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-[rgba(255,255,255,0.96)] px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{dirty ? 'Unsaved' : 'Saved'}</div>
            <div className="truncate text-sm text-slate-600">{data.businessName || 'Profile editor'}</div>
          </div>
          <button type="submit" form="profile-editor-form" disabled={disableSave} className={primaryButtonClass}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>


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

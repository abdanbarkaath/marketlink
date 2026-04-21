import type { ReactNode } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import ResetPasswordPanel from '@/components/admin/ResetPasswordPanel';

export const dynamic = 'force-dynamic';

type Provider = {
  id: string;
  slug: string;
  businessName: string;
  email: string;
  city: string;
  state: string;
  zip?: string | null;
  tagline?: string | null;
  logo?: string | null;
  services?: string[];
  notes?: string | null;
  status: 'pending' | 'active' | 'disabled';
  verified: boolean;
  disabledReason?: string | null;
  rating?: number;
  createdAt: string;
  updatedAt: string;
};

async function adminFetchJSON<T>(path: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const cookie = headers().get('cookie') || '';
  const res = await fetch(`${apiBase}${path}`, {
    cache: 'no-store',
    headers: { 'content-type': 'application/json', cookie },
  });

  if (res.status === 401 || res.status === 403) {
    redirect('/login?returnTo=/dashboard/admin');
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt);
  }

  return (await res.json()) as T;
}

async function adminPatch(path: string, body: unknown) {
  'use server';
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const cookie = headers().get('cookie') || '';

  const res = await fetch(`${apiBase}${path}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Admin action failed (${res.status}): ${txt}`);
  }
}

function parseServices(raw: string) {
  const parts = raw
    .split(/[\n,]/g)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(parts)).slice(0, 50);
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">{children}</span>;
}

function StatusPill({ status }: { status: Provider['status'] }) {
  const cls =
    status === 'active'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'pending'
      ? 'border-stone-200 bg-stone-50 text-stone-700'
      : 'border-red-200 bg-red-50 text-red-700';
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${cls}`}>{status}</span>;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-800">{label}</label>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

type AdminProviderEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProviderEditPage({ params }: AdminProviderEditPageProps) {
  const { id } = await params;

  const data = await adminFetchJSON<{ ok: true; provider: Provider }>(`/admin/providers/${id}`);
  const p = data.provider;

  const save = async (formData: FormData) => {
    'use server';

    const businessName = String(formData.get('businessName') || '').trim();
    const email = String(formData.get('email') || '')
      .trim()
      .toLowerCase();
    const slug = String(formData.get('slug') || '').trim();
    const city = String(formData.get('city') || '').trim();
    const state = String(formData.get('state') || '').trim();
    const zip = String(formData.get('zip') || '').trim();
    const tagline = String(formData.get('tagline') || '').trim();
    const logo = String(formData.get('logo') || '').trim();
    const notes = String(formData.get('notes') || '').trim();
    const servicesRaw = String(formData.get('services') || '');
    const services = parseServices(servicesRaw);
    const status = String(formData.get('status') || 'active') as Provider['status'];
    const verified = String(formData.get('verified') || 'false') === 'true';
    const disabledReason = String(formData.get('disabledReason') || '').trim();

    const patch: Record<string, unknown> = {
      businessName,
      email,
      slug,
      city,
      state,
      zip: zip || null,
      tagline: tagline || null,
      logo: logo || null,
      notes: notes || null,
      services,
      verified,
      status,
    };

    if (status === 'disabled') patch.disabledReason = disabledReason;

    await adminPatch(`/admin/providers/${id}`, patch);

    revalidatePath('/dashboard/admin');
    revalidatePath(`/dashboard/admin/providers/${id}`);
    redirect('/dashboard/admin');
  };

  const shellClass =
    'rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(236,242,248,0.96))] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6';
  const mutedPanelClass =
    'rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]';
  const inputClass =
    'w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200/70';

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <section className={`${shellClass} overflow-hidden`}>
        <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1.45fr)_320px] xl:items-stretch">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Provider moderation</p>
              <StatusPill status={p.status} />
              {p.verified ? <Badge>Verified</Badge> : <Badge>Not verified</Badge>}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Edit provider</h1>
            <p className="text-sm text-slate-600">{p.businessName}</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span>ID: {p.id}</span>
              <span>•</span>
              <span>Updated: {new Date(p.updatedAt).toLocaleString()}</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge>Neutral admin flow</Badge>
              <Badge>Moderation safe</Badge>
              <Badge>Public profile review</Badge>
            </div>
          </div>

          <div className={`${mutedPanelClass} flex flex-col justify-between`}>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Snapshot</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-[0_18px_34px_rgba(15,23,42,0.18)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Status</div>
                  <div className="mt-2 text-lg font-semibold capitalize">{p.status}</div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Rating</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{typeof p.rating === 'number' ? p.rating.toFixed(1) : '0.0'}</div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <Link href={`/providers/${p.slug}`} className="rounded-full border border-slate-200/80 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                View public page
              </Link>
              <Link href="/dashboard/admin" className="rounded-full bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800">
                Back to admin
              </Link>
            </div>
          </div>
        </div>
      </section>

      <form action={save} className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="order-1 space-y-5">
          <section className={shellClass}>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] text-xs text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                {p.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  'LOGO'
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-lg font-semibold text-slate-900">{p.businessName}</div>
                  {typeof p.rating === 'number' ? <Badge>Rating: {p.rating.toFixed(1)}</Badge> : <Badge>Rating: 0.0</Badge>}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {p.city}, {p.state}
                  {p.zip ? ` ${p.zip}` : ''}
                </div>
                {p.tagline ? <div className="mt-1 text-sm text-slate-700">{p.tagline}</div> : <div className="mt-1 text-sm text-slate-400">No tagline</div>}
                <div className="mt-2 break-all text-xs text-slate-500">
                  Slug: <span className="font-mono">{p.slug}</span>
                </div>
              </div>
            </div>

            {p.services?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {p.services.slice(0, 8).map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
                {p.services.length > 8 ? <Badge>+{p.services.length - 8} more</Badge> : null}
              </div>
            ) : (
              <div className="mt-4 text-xs text-slate-500">No services listed.</div>
            )}
          </section>

          <section className={shellClass}>
            <SectionTitle title="Public information" subtitle="These fields affect what users see on the provider profile." />

            <div className="mt-5 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Business name">
                  <input name="businessName" defaultValue={p.businessName} className={inputClass} />
                </Field>

                <Field label="Email">
                  <input name="email" defaultValue={p.email} className={inputClass} />
                </Field>

                <Field label="Slug" hint="Used in URL">
                  <input name="slug" defaultValue={p.slug} className={`${inputClass} font-mono`} />
                </Field>

                <Field label="Tagline" hint="Optional">
                  <input name="tagline" defaultValue={p.tagline ?? ''} className={inputClass} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="City">
                  <input name="city" defaultValue={p.city} className={inputClass} />
                </Field>

                <Field label="State">
                  <input name="state" defaultValue={p.state} className={inputClass} />
                </Field>

                <Field label="Zip" hint="Optional">
                  <input name="zip" defaultValue={p.zip ?? ''} className={inputClass} />
                </Field>
              </div>

              <Field label="Logo URL" hint="Optional">
                <input name="logo" defaultValue={p.logo ?? ''} className={inputClass} />
              </Field>

              <Field label="Services" hint="Comma or newline separated">
                <textarea name="services" defaultValue={(p.services ?? []).join(', ')} className={`${inputClass} min-h-[112px]`} placeholder="SEO, Ads, Social Media" />
              </Field>
            </div>
          </section>
        </div>

        <aside className="order-2 space-y-5 xl:sticky xl:top-6 xl:self-start">
          <section className={shellClass}>
            <SectionTitle title="Admin controls" subtitle="Moderation and access-related settings." />

            <div className="mt-5 grid gap-4">
              <Field label="Status">
                <select name="status" defaultValue={p.status} className={inputClass}>
                  <option value="pending">pending</option>
                  <option value="active">active</option>
                  <option value="disabled">disabled</option>
                </select>
              </Field>

              <Field label="Disabled reason" hint="Required if disabled">
                <div>
                  <input name="disabledReason" defaultValue={p.disabledReason ?? ''} className={inputClass} placeholder="Explain why this provider is disabled" />
                  <p className="mt-2 text-xs text-slate-500">
                    If you set status to <span className="font-medium">disabled</span>, this must be non-empty.
                  </p>
                </div>
              </Field>

              <Field label="Verified">
                <select name="verified" defaultValue={String(p.verified)} className={inputClass}>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </Field>
            </div>
          </section>

          <section className={shellClass}>
            <SectionTitle title="Access" subtitle="Reset the provider password." />
            <div className="mt-5">
              <ResetPasswordPanel providerId={p.id} providerEmail={p.email} />
            </div>
          </section>

          <section className={shellClass}>
            <SectionTitle title="Admin notes" subtitle="Internal notes, never shown publicly." />
            <div className="mt-5">
              <textarea
                name="notes"
                defaultValue={p.notes ?? ''}
                className={`${inputClass} min-h-[160px]`}
                placeholder="E.g., contacted provider on Dec 22. Missing portfolio links."
              />
            </div>
          </section>

          <section className={shellClass}>
            <div className="flex flex-col gap-3">
              <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Save changes</button>
              <Link href="/dashboard/admin" className="rounded-full border border-slate-200/80 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                Cancel
              </Link>
              <div className="text-xs text-slate-500">
                Heads up: changing <span className="font-medium">email</span> or <span className="font-medium">slug</span> can break links or conflict with existing records.
              </div>
            </div>
          </section>
        </aside>
      </form>
    </main>
  );
}

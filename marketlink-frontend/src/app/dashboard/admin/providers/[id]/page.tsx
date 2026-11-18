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
  const requestHeaders = await headers();
  const cookie = requestHeaders.get('cookie') || '';
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
  const requestHeaders = await headers();
  const cookie = requestHeaders.get('cookie') || '';

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
  return <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">{children}</span>;
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
      {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <label htmlFor={id} className="text-sm font-semibold text-slate-800">{label}</label>
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

  const shellClass = 'ml-card rounded-xl p-5 sm:p-6';
  const inputClass = 'ml-input min-h-11 w-full px-3 py-2 text-base text-slate-900';

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="dashboard-intro flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Edit provider</h1>
          <p className="dashboard-intro-copy mt-2 text-sm leading-6">{p.businessName}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill status={p.status} />
            <Badge>{p.verified ? 'Verified' : 'Not verified'}</Badge>
          </div>
          <p className="dashboard-intro-copy mt-3 text-xs">Updated {new Date(p.updatedAt).toLocaleString()} · ID {p.id}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href={`/providers/${p.slug}`} className="ml-btn-secondary inline-flex shrink-0 items-center justify-center px-5 text-sm font-semibold">
            View public page
          </Link>
        </div>
      </section>

      <form action={save} className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="order-1 space-y-5">
          <section className={shellClass}>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600">
                {p.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span aria-hidden="true" className="text-lg font-bold text-[#192a48]">{p.businessName.slice(0, 1).toUpperCase()}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">{p.businessName}</h2>
                  {typeof p.rating === 'number' ? <Badge>Rating: {p.rating.toFixed(1)}</Badge> : <Badge>Rating: 0.0</Badge>}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {p.city}, {p.state}
                  {p.zip ? ` ${p.zip}` : ''}
                </div>
                {p.tagline ? <div className="mt-1 text-sm text-slate-700">{p.tagline}</div> : <div className="mt-1 text-sm text-slate-600">No tagline</div>}
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
                <Field id="admin-businessName" label="Business name">
                  <input id="admin-businessName" name="businessName" defaultValue={p.businessName} className={inputClass} />
                </Field>

                <Field id="admin-email" label="Email">
                  <input id="admin-email" name="email" defaultValue={p.email} className={inputClass} />
                </Field>

                <Field id="admin-slug" label="Slug" hint="Used in URL">
                  <input id="admin-slug" name="slug" defaultValue={p.slug} className={`${inputClass} font-mono`} />
                </Field>

                <Field id="admin-tagline" label="Tagline" hint="Optional">
                  <input id="admin-tagline" name="tagline" defaultValue={p.tagline ?? ''} className={inputClass} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="admin-city" label="City">
                  <input id="admin-city" name="city" defaultValue={p.city} className={inputClass} />
                </Field>

                <Field id="admin-state" label="State">
                  <input id="admin-state" name="state" defaultValue={p.state} className={inputClass} />
                </Field>

                <Field id="admin-zip" label="Zip" hint="Optional">
                  <input id="admin-zip" name="zip" defaultValue={p.zip ?? ''} className={inputClass} />
                </Field>
              </div>

              <Field id="admin-logo" label="Logo URL" hint="Optional">
                <input id="admin-logo" name="logo" defaultValue={p.logo ?? ''} className={inputClass} />
              </Field>

              <Field id="admin-services" label="Services" hint="Comma or newline separated">
                <textarea id="admin-services" name="services" defaultValue={(p.services ?? []).join(', ')} className={`${inputClass} min-h-[112px]`} placeholder="SEO, Ads, Social Media" />
              </Field>
            </div>
          </section>
        </div>

        <aside className="order-2 space-y-5 xl:sticky xl:top-6 xl:self-start">
          <section className={shellClass}>
            <SectionTitle title="Admin controls" subtitle="Moderation and access-related settings." />

            <div className="mt-5 grid gap-4">
              <Field id="admin-status" label="Status">
                <select id="admin-status" name="status" defaultValue={p.status} className={inputClass}>
                  <option value="pending">pending</option>
                  <option value="active">active</option>
                  <option value="disabled">disabled</option>
                </select>
              </Field>

              <Field id="admin-disabledReason" label="Disabled reason" hint="Required if disabled">
                <div>
                  <input id="admin-disabledReason" name="disabledReason" defaultValue={p.disabledReason ?? ''} className={inputClass} placeholder="Explain why this provider is disabled" />
                  <p className="mt-2 text-xs text-slate-500">
                    If you set status to <span className="font-medium">disabled</span>, this must be non-empty.
                  </p>
                </div>
              </Field>

              <Field id="admin-verified" label="Verified">
                <select id="admin-verified" name="verified" defaultValue={String(p.verified)} className={inputClass}>
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
            <Field id="admin-notes" label="Admin notes" hint="Internal only">
              <textarea
                id="admin-notes"
                name="notes"
                defaultValue={p.notes ?? ''}
                className={`${inputClass} min-h-[160px]`}
                placeholder="E.g., contacted provider on Dec 22. Missing portfolio links."
              />
            </Field>
          </section>

          <section className={shellClass}>
            <div className="flex flex-col gap-3">
              <button type="submit" className="ml-btn-primary px-5 py-3 text-sm font-semibold">Save changes</button>
              <Link href="/dashboard/admin" className="ml-btn-secondary inline-flex items-center justify-center px-5 py-3 text-sm font-semibold">
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

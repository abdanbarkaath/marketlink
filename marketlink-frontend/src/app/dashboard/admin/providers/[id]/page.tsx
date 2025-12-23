import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

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

async function adminPatch(path: string, body: any) {
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

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border bg-white px-2 py-0.5 text-xs font-medium text-gray-700">{children}</span>;
}

function StatusPill({ status }: { status: Provider['status'] }) {
  const cls = status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200';
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

export default async function AdminProviderEditPage({ params }: { params: { id: string } }) {
  const { id } = params;

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

    const patch: any = {
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">Edit Provider</h1>
            <StatusPill status={p.status} />
            {p.verified ? <Badge>Verified</Badge> : <Badge>Not verified</Badge>}
          </div>
          <p className="text-sm text-gray-600">{p.businessName}</p>
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span>ID: {p.id}</span>
            <span>•</span>
            <span>Updated: {new Date(p.updatedAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/providers/${p.slug}`} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
            View public page
          </Link>
          <Link href="/dashboard/admin" className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
            ← Back
          </Link>
        </div>
      </div>

      {/* Content */}
      <form action={save} className="grid gap-6 lg:grid-cols-3">
        {/* Left: Public details */}
        <section className="lg:col-span-2 space-y-6">
          {/* Preview Card */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 shrink-0 rounded-xl border bg-gray-50 flex items-center justify-center text-xs text-gray-500 overflow-hidden">
                {p.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  'LOGO'
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-base font-semibold text-gray-900">{p.businessName}</div>
                  {typeof p.rating === 'number' ? <Badge>Rating: {p.rating.toFixed(1)}</Badge> : <Badge>Rating: 0.0</Badge>}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {p.city}, {p.state}
                  {p.zip ? ` ${p.zip}` : ''}
                </div>
                {p.tagline ? <div className="mt-1 text-sm text-gray-700">{p.tagline}</div> : <div className="mt-1 text-sm text-gray-400">No tagline</div>}
                <div className="mt-2 text-xs text-gray-500 break-all">
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
              <div className="mt-4 text-xs text-gray-500">No services listed.</div>
            )}
          </div>

          {/* Public Info */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-5">
            <SectionTitle title="Public information" subtitle="These fields affect what users see on the provider profile." />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business name">
                <input name="businessName" defaultValue={p.businessName} className="w-full rounded-xl border px-3 py-2 text-sm" />
              </Field>

              <Field label="Email">
                <input name="email" defaultValue={p.email} className="w-full rounded-xl border px-3 py-2 text-sm" />
              </Field>

              <Field label="Slug" hint="Used in URL">
                <input name="slug" defaultValue={p.slug} className="w-full rounded-xl border px-3 py-2 text-sm font-mono" />
              </Field>

              <Field label="Tagline" hint="Optional">
                <input name="tagline" defaultValue={p.tagline ?? ''} className="w-full rounded-xl border px-3 py-2 text-sm" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City">
                <input name="city" defaultValue={p.city} className="w-full rounded-xl border px-3 py-2 text-sm" />
              </Field>

              <Field label="State">
                <input name="state" defaultValue={p.state} className="w-full rounded-xl border px-3 py-2 text-sm" />
              </Field>

              <Field label="Zip" hint="Optional">
                <input name="zip" defaultValue={p.zip ?? ''} className="w-full rounded-xl border px-3 py-2 text-sm" />
              </Field>
            </div>

            <Field label="Logo URL" hint="Optional">
              <input name="logo" defaultValue={p.logo ?? ''} className="w-full rounded-xl border px-3 py-2 text-sm" />
            </Field>

            <Field label="Services" hint="Comma or newline separated">
              <textarea name="services" defaultValue={(p.services ?? []).join(', ')} className="w-full rounded-xl border px-3 py-2 text-sm min-h-[96px]" placeholder="SEO, Ads, Social Media" />
            </Field>
          </div>
        </section>

        {/* Right: Admin controls */}
        <aside className="space-y-6">
          <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-5">
            <SectionTitle title="Admin controls" subtitle="Moderation and access-related settings." />

            <Field label="Status">
              <select name="status" defaultValue={p.status} className="w-full rounded-xl border px-3 py-2 text-sm">
                <option value="pending">pending</option>
                <option value="active">active</option>
                <option value="disabled">disabled</option>
              </select>
            </Field>

            <Field label="Disabled reason" hint="Required if disabled">
              <input name="disabledReason" defaultValue={p.disabledReason ?? ''} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Explain why this provider is disabled" />
              <p className="text-xs text-gray-500 mt-1">
                If you set status to <span className="font-medium">disabled</span>, this must be non-empty.
              </p>
            </Field>

            <Field label="Verified">
              <select name="verified" defaultValue={String(p.verified)} className="w-full rounded-xl border px-3 py-2 text-sm">
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </Field>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
            <SectionTitle title="Admin notes" subtitle="Internal notes (not shown publicly)." />
            <textarea
              name="notes"
              defaultValue={p.notes ?? ''}
              className="w-full rounded-xl border px-3 py-2 text-sm min-h-[140px]"
              placeholder="E.g., contacted provider on Dec 22. Missing portfolio links."
            />
          </div>

          {/* Actions */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2">
              <button className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90">Save changes</button>
              <Link href="/dashboard/admin" className="rounded-xl border px-4 py-2.5 text-sm text-center hover:bg-gray-50">
                Cancel
              </Link>
              <div className="mt-3 text-xs text-gray-500">
                Heads up: changing <span className="font-medium">email</span> or <span className="font-medium">slug</span> can break links or conflict with existing records.
              </div>
            </div>
          </div>
        </aside>
      </form>
    </main>
  );
}

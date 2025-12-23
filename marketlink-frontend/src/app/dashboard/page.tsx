'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type User = { id: string; email: string; role: 'provider' | 'admin' };

type ProviderSummary = {
  id: string;
  slug: string;
  businessName: string;
  city: string;
  state: string;
  status: 'active' | 'pending' | 'disabled';
  disabledReason?: string;
} | null;

type InquiryRow = {
  id: string;
  status: 'NEW' | 'READ' | 'ARCHIVED';
  createdAt: string;
};

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border bg-white px-2 py-0.5 text-xs font-medium text-gray-700">{children}</span>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-gray-900">{children}</h2>;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<ProviderSummary>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inquiryCount, setInquiryCount] = useState<number | null>(null);
  const [newInquiryCount, setNewInquiryCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/me/summary`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Failed (${res.status})`);
        }

        const data = await res.json();

        // ✅ Role split: admins do NOT use the provider dashboard
        if (data?.user?.role === 'admin') {
          router.replace('/dashboard/admin');
          return;
        }

        setUser(data.user);
        setProvider(data.provider ?? null);
      } catch (e: any) {
        setError(e?.message ?? 'Something went wrong');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Pull inquiry count for quick actions (only if the user has a provider)
  useEffect(() => {
    if (!provider) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/inquiries`, {
          credentials: 'include',
          cache: 'no-store',
        });

        // If not authed or not allowed, just hide counts (don’t block dashboard)
        if (!res.ok) return;

        const body = (await res.json()) as { ok: true; data: InquiryRow[] } | any;
        const rows = Array.isArray(body?.data) ? body.data : [];

        setInquiryCount(rows.length);
        setNewInquiryCount(rows.filter((r) => r.status === 'NEW').length);
      } catch {
        // ignore
      }
    })();
  }, [provider]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border p-6">
          <p className="text-sm text-gray-600">Loading dashboard…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">Error: {error}</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="font-medium text-gray-900">{user.email}</span>
            <Pill>{user.role}</Pill>
          </div>
        </div>

        <div className="text-sm text-gray-600">{provider ? `${provider.businessName} · ${provider.city}, ${provider.state}` : 'Create your profile to get listed.'}</div>
      </div>

      {/* Layout */}
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {/* Primary column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Primary hero card */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            {!provider ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Set up your provider profile</h2>
                    <p className="mt-1 text-sm text-gray-600">Finish setup to appear in search and start getting inquiries.</p>
                  </div>
                  <Pill>Setup</Pill>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border p-4">
                    <SectionTitle>Business</SectionTitle>
                    <p className="mt-1 text-sm text-gray-600">Name, city, state</p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <SectionTitle>Services</SectionTitle>
                    <p className="mt-1 text-sm text-gray-600">SEO, ads, social</p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <SectionTitle>Polish</SectionTitle>
                    <p className="mt-1 text-sm text-gray-600">Logo, tagline</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <Link href="/dashboard/onboarding" className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                    Create profile
                  </Link>
                  <span className="text-xs text-gray-500">Takes about 2–3 minutes.</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{provider.businessName}</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {provider.city}, {provider.state}
                    </p>
                  </div>
                  <Pill>{provider.status}</Pill>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href="/dashboard/profile" className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                    Edit profile
                  </Link>

                  <Link href="/dashboard/inquiries" className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                    Inquiries
                    {newInquiryCount !== null && newInquiryCount > 0 ? <span className="ml-2 rounded-full border bg-white px-2 py-0.5 text-xs">{newInquiryCount} new</span> : null}
                  </Link>
                </div>

                <div className="mt-6 rounded-2xl border bg-gray-50 p-4">
                  <SectionTitle>Next steps</SectionTitle>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                    <li>Check your inquiries and reply fast</li>
                    <li>Add more services so you show up in more searches</li>
                    <li>Upload a logo and tighten your tagline</li>
                  </ul>
                </div>
              </>
            )}
          </section>

          {/* Secondary card */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <SectionTitle>Quick actions</SectionTitle>
              {provider ? <Pill>{inquiryCount === null ? 'Loading…' : `${inquiryCount} total`}</Pill> : <Pill>Setup first</Pill>}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link href={provider ? '/dashboard/inquiries' : '/dashboard/onboarding'} className="rounded-2xl border p-4 hover:bg-gray-50" aria-disabled={!provider}>
                <div className="text-sm font-semibold">Inquiries</div>
                <p className="mt-1 text-sm text-gray-600">{provider ? 'View and respond to leads.' : 'Create a profile first to receive leads.'}</p>
              </Link>

              <div className="rounded-2xl border p-4">
                <div className="text-sm font-semibold">Verification</div>
                <p className="mt-1 text-sm text-gray-600">Get verified to rank higher.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <SectionTitle>Account</SectionTitle>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <div className="font-mono text-gray-900">{user.email}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Role</div>
                <div className="text-gray-900">{user.role}</div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-gray-50 p-6">
            <SectionTitle>Status</SectionTitle>

            <p className="mt-2 text-sm text-gray-600">
              {!provider
                ? 'You are not listed yet. Complete setup to get discovered.'
                : provider.status === 'active'
                ? 'Your profile is live and visible in search.'
                : provider.status === 'pending'
                ? 'Your profile is pending review and not visible in search yet.'
                : provider.status === 'disabled'
                ? `Your profile is disabled and hidden from search.${provider.disabledReason ? ` Reason: ${provider.disabledReason}` : ''}`
                : 'Your profile status is unknown.'}
            </p>

            {provider?.status === 'pending' ? <p className="mt-3 text-xs text-gray-500">Tip: make sure your services and city are accurate.</p> : null}
          </section>
        </div>
      </div>
    </main>
  );
}

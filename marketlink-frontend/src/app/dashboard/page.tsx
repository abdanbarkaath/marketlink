'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type User = { id: string; email: string; role: 'provider' | 'admin' };
type ProviderSummary = { id: string; slug: string; businessName: string; city: string; state: string } | null;

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<ProviderSummary>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setUser(data.user);
        setProvider(data.provider ?? null);
      } catch (e: any) {
        setError(e?.message ?? 'Something went wrong');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p>Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-red-600">Error: {error}</p>
      </main>
    );
  }

  if (!user) return null; // redirected already

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome, <span className="font-medium">{user.email}</span>
      </p>

      {/* If no provider yet → show onboarding prompt */}
      {!provider ? (
        <section className="mt-8 grid gap-4">
          <div className="rounded-2xl border p-5">
            <h2 className="text-lg font-semibold">Create your provider profile</h2>
            <p className="mt-2 text-sm text-gray-700">You don’t have a profile yet. Add your business details so customers can find you.</p>
            <ol className="mt-4 list-decimal pl-5 text-sm text-gray-700 space-y-1">
              <li>Business name, city & state</li>
              <li>Services (SEO, ads, social, etc.)</li>
              <li>Tagline and logo (optional)</li>
            </ol>
            <Link href="/dashboard/onboarding" prefetch className="mt-5 inline-block rounded-xl border px-4 py-2 font-medium hover:bg-gray-50">
              Create profile
            </Link>
            <p className="mt-2 text-xs text-gray-500">This will take just a minute.</p>
          </div>

          <div className="rounded-2xl border p-5">
            <h2 className="text-lg font-semibold">Account</h2>
            <div className="mt-3 text-sm">
              <div>
                Email: <span className="font-mono">{user.email}</span>
              </div>
              <div className="mt-1">Role: {user.role}</div>
            </div>
          </div>
        </section>
      ) : (
        // Provider exists → show quick actions
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border p-5">
            <h2 className="text-lg font-semibold">Your profile</h2>
            <p className="mt-2 text-sm text-gray-700">
              <span className="font-medium">{provider.businessName}</span> — {provider.city}, {provider.state}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/providers/${provider.slug}`} prefetch className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                View public page
              </Link>
              <Link href="/dashboard/profile" prefetch className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                Edit profile
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border p-5">
            <h2 className="text-lg font-semibold">Account</h2>
            <div className="mt-3 text-sm">
              <div>
                Email: <span className="font-mono">{user.email}</span>
              </div>
              <div className="mt-1">Role: {user.role}</div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

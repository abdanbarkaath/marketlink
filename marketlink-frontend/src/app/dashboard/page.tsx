'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type User = { id: string; email: string; role: 'provider' | 'admin' };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include', // send session cookie to API
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else if (res.status === 401) {
          router.replace('/login');
          return;
        } else {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Failed (${res.status})`);
        }
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

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">Next steps</h2>
          <ol className="mt-3 list-decimal pl-5 text-sm text-gray-700 space-y-1">
            <li>Connect your provider profile (coming next).</li>
            <li>Edit business details, services, and logo.</li>
            <li>Start receiving inquiries.</li>
          </ol>
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
      </div>
    </main>
  );
}

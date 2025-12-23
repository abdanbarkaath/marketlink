'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function safeInternalPath(raw: string | null | undefined, fallback: string) {
  const v = (raw || '').trim();
  if (!v || !v.startsWith('/')) return fallback;
  if (v.startsWith('//')) return fallback;
  return v;
}

export default function VerifyPage() {
  const router = useRouter();
  const search = useSearchParams();

  // Keep compatibility with old links that might include returnTo/next
  const returnTo = useMemo(() => {
    const rt = search.get('returnTo');
    const next = search.get('next');
    return safeInternalPath(rt ?? next, '/dashboard');
  }, [search]);

  useEffect(() => {
    const qs = new URLSearchParams();
    qs.set('returnTo', returnTo);

    // Magic link is retired, send everyone to login.
    router.replace(`/login?${qs.toString()}`);
    router.refresh();
  }, [router, returnTo]);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Magic link login retired</h1>
      <p className="mt-3 text-sm text-gray-600">Redirecting you to the login page…</p>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function VerifyPage() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get('token');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    async function run() {
      if (!token) {
        setStatus('error');
        setMessage('Missing token.');
        return;
      }
      setStatus('verifying');
      setMessage('Verifying magic link…');

      try {
        const res = await fetch(`${API_BASE}/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // IMPORTANT: set session cookie on API domain
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({} as any));
          throw new Error(body?.error || `Verify failed (${res.status})`);
        }

        setStatus('success');
        setMessage('Verified! Redirecting to your dashboard…');
        // Small delay so the user sees the success state
        setTimeout(() => router.replace('/dashboard'), 600);
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message || 'Verification failed.');
      }
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Verifying…</h1>
      <p className="mt-3 text-sm">{message || 'Please wait.'}</p>
      <div className="mt-6 rounded-xl border p-4 text-sm">
        <div>
          Status: <strong>{status}</strong>
        </div>
        <div className="mt-2 text-xs text-gray-500">If this page doesn’t continue, request a new magic link.</div>
      </div>
    </main>
  );
}

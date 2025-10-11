'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type MeSummary =
  | {
      ok: true;
      user: { id: string; email: string; role: 'provider' | 'admin' };
      provider: { id: string; slug: string } | null;
    }
  | { ok: false };

export default function OwnerControls({ slug }: { slug: string }) {
  const [owns, setOwns] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/me/summary`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) {
          // not logged in or other error; render nothing
          return;
        }
        const data: MeSummary = await res.json();
        if (!cancelled && 'provider' in data) {
          setOwns(!!data.provider && data.provider.slug === slug);
        }
      } catch {
        // ignore; render nothing
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!owns) return null;

  return (
    <div className="ml-auto">
      <Link href="/dashboard/profile" prefetch className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50" aria-label="Edit your profile">
        ✏️ Edit profile
      </Link>
    </div>
  );
}

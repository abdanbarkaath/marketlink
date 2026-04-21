'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LogoutButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);

    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors; still proceed with redirect.
    } finally {
      setLoading(false);
      router.replace('/');
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? 'Logging out...' : 'Log out'}
    </button>
  );
}

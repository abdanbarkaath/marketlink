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
      // ignore network errors; still redirect
    } finally {
      setLoading(false);
      router.replace('/login');
    }
  }

  return (
    <button onClick={handleLogout} className={`rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50 ${className}`} disabled={loading}>
      {loading ? 'Logging out…' : 'Log out'}
    </button>
  );
}

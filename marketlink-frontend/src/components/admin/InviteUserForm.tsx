'use client';

import { useState } from 'react';

type InviteResult = {
  ok: boolean;
  tempPassword?: string;
  emailSent?: boolean;
  error?: string;
};

export default function InviteUserForm() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'provider' | 'admin'>('provider');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setBusy(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/users/invite`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      const data = (await res.json().catch(() => ({}))) as any;

      if (!res.ok) {
        setResult({ ok: false, error: data?.error || 'Invite failed.' });
      } else {
        setResult({ ok: true, tempPassword: data?.tempPassword, emailSent: data?.emailSent });
      }
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || 'Invite failed.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
          placeholder="owner@agency.com"
          required
        />
      </label>

      <label className="block text-sm font-medium">
        Role
        <select value={role} onChange={(e) => setRole(e.target.value as 'provider' | 'admin')} className="mt-1 w-full rounded border px-3 py-2 text-sm">
          <option value="provider">provider</option>
          <option value="admin">admin</option>
        </select>
      </label>

      <button type="submit" disabled={busy} className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {busy ? 'Sending...' : 'Send invite'}
      </button>

      {result ? (
        <div className={`rounded border px-3 py-2 text-sm ${result.ok ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {result.ok ? (
            <div className="space-y-1">
              <div>Invite created.</div>
              <div>Email sent: {result.emailSent ? 'yes' : 'no'}</div>
              {result.tempPassword ? <div>Temp password: <span className="font-mono">{result.tempPassword}</span></div> : null}
            </div>
          ) : (
            <div>{result.error}</div>
          )}
        </div>
      ) : null}
    </form>
  );
}

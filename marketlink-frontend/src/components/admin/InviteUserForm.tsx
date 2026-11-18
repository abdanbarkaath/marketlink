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

      const data = (await res.json().catch(() => ({}))) as { error?: string; tempPassword?: string; emailSent?: boolean };

      if (!res.ok) {
        setResult({ ok: false, error: data?.error || 'Invite failed.' });
      } else {
        setResult({ ok: true, tempPassword: data?.tempPassword, emailSent: data?.emailSent });
      }
    } catch (err: unknown) {
      setResult({ ok: false, error: err instanceof Error ? err.message : 'Invite failed.' });
    } finally {
      setBusy(false);
    }
  };

  const fieldClass = 'ml-input mt-1 min-h-11 w-full px-3 py-2 text-base text-slate-900';

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5">
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} placeholder="owner@agency.com" required />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as 'provider' | 'admin')} className={fieldClass}>
            <option value="provider">Provider</option>
            <option value="admin">Admin</option>
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="ml-btn-primary w-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {busy ? 'Sending...' : 'Send invite'}
      </button>

      {result ? (
        <div
          className={`rounded-xl border p-4 text-sm ${
            result.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {result.ok ? (
            <div className="space-y-3">
              <div>
                <div role="status" className="font-semibold text-emerald-900">Invite created</div>
                <div className="mt-1 text-emerald-800">Email sent: {result.emailSent ? 'yes' : 'no'}</div>
              </div>
              {result.tempPassword ? (
                <div className="rounded-lg border border-emerald-200 bg-white px-4 py-3">
                  <div className="text-sm font-semibold text-emerald-800">Temporary password</div>
                  <div className="mt-2 break-all font-mono text-sm text-slate-900">{result.tempPassword}</div>
                </div>
              ) : null}
              <div className="text-xs text-emerald-800">The invited user should change this password on first sign-in.</div>
            </div>
          ) : (
            <div role="alert">{result.error}</div>
          )}
        </div>
      ) : null}
    </form>
  );
}

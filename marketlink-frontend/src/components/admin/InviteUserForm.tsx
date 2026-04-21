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

  const fieldClass =
    'mt-1 w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200/70';
  const mutedPanelClass =
    'rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]';

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className={mutedPanelClass}>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Access setup</div>
        <p className="mt-2 text-sm leading-6 text-slate-600">Invite the user, then share the generated temporary password only through the intended flow shown below.</p>
      </div>

      <div className="grid gap-5">
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} placeholder="owner@agency.com" required />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as 'provider' | 'admin')} className={fieldClass}>
            <option value="provider">provider</option>
            <option value="admin">admin</option>
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {busy ? 'Sending...' : 'Send invite'}
      </button>

      {result ? (
        <div
          className={`rounded-[24px] border px-4 py-4 text-sm shadow-[0_10px_30px_rgba(15,23,42,0.04)] ${
            result.ok
              ? 'border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(209,250,229,0.88))] text-emerald-800'
              : 'border-red-200 bg-[linear-gradient(180deg,rgba(254,242,242,0.95),rgba(254,226,226,0.9))] text-red-800'
          }`}
        >
          {result.ok ? (
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-emerald-900">Invite created</div>
                <div className="mt-1 text-emerald-800">Email sent: {result.emailSent ? 'yes' : 'no'}</div>
              </div>
              {result.tempPassword ? (
                <div className="rounded-[22px] border border-emerald-200 bg-white/85 px-4 py-3 shadow-[0_8px_24px_rgba(16,185,129,0.08)]">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Temp password</div>
                  <div className="mt-2 break-all font-mono text-sm text-slate-900">{result.tempPassword}</div>
                </div>
              ) : null}
              <div className="text-xs text-emerald-800">The invited user should change this password on first sign-in.</div>
            </div>
          ) : (
            <div>{result.error}</div>
          )}
        </div>
      ) : null}
    </form>
  );
}

'use client';

import { useState } from 'react';

type ResetResult = {
  ok: boolean;
  tempPassword?: string;
  emailSent?: boolean;
  error?: string;
};

export default function ResetPasswordPanel({ providerId, providerEmail }: { providerId: string; providerEmail: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResetResult | null>(null);

  const reset = async () => {
    setResult(null);
    setBusy(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/providers/${providerId}/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string; tempPassword?: string; emailSent?: boolean };
      if (!res.ok) {
        setResult({ ok: false, error: data?.error || 'Reset failed.' });
      } else {
        setResult({ ok: true, tempPassword: data?.tempPassword, emailSent: data?.emailSent });
      }
    } catch (err: unknown) {
      setResult({ ok: false, error: err instanceof Error ? err.message : 'Reset failed.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="break-words text-sm leading-6 text-slate-600">
        Send a new temporary password to <span className="font-medium text-slate-800">{providerEmail}</span>.
      </p>

      <button
        type="button"
        onClick={reset}
        disabled={busy}
        className="ml-btn-secondary w-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {busy ? 'Resetting...' : 'Reset password'}
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
                <div role="status" className="font-semibold text-emerald-900">Password reset created</div>
                <div className="mt-1 text-emerald-800">Email sent: {result.emailSent ? 'yes' : 'no'}</div>
              </div>
              {result.tempPassword ? (
                <div className="rounded-lg border border-emerald-200 bg-white px-4 py-3">
                  <div className="text-sm font-semibold text-emerald-800">Temporary password</div>
                  <div className="mt-2 break-all font-mono text-sm text-slate-900">{result.tempPassword}</div>
                </div>
              ) : null}
              <div className="text-xs text-emerald-800">The provider should change this password on the next sign-in.</div>
            </div>
          ) : (
            <div role="alert">{result.error}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

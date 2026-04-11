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

      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) {
        setResult({ ok: false, error: data?.error || 'Reset failed.' });
      } else {
        setResult({ ok: true, tempPassword: data?.tempPassword, emailSent: data?.emailSent });
      }
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || 'Reset failed.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500">Send a new temp password to {providerEmail}.</div>
      <button type="button" onClick={reset} disabled={busy} className="rounded border px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-60">
        {busy ? 'Resetting...' : 'Reset password'}
      </button>

      {result ? (
        <div className={`rounded border px-2 py-1.5 text-xs ${result.ok ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {result.ok ? (
            <div className="space-y-1">
              <div>Email sent: {result.emailSent ? 'yes' : 'no'}</div>
              {result.tempPassword ? <div>Temp password: <span className="font-mono">{result.tempPassword}</span></div> : null}
            </div>
          ) : (
            <div>{result.error}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

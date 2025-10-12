// src/lib/mailer.ts
// Minimal Resend-based mail helper for magic links.
// Uses the REST API directly so you don't need another SDK.

type SendResult = { ok: true } | { ok: false; error?: string };

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const MAIL_FROM = process.env.MAIL_FROM || ''; // e.g. "Marketus <no-reply@yourdomain.com>"
const APP_NAME = process.env.APP_NAME || 'Marketus';

/**
 * Sends a magic-link email. If env vars are missing, logs and returns ok:false.
 */
export async function sendMagicLinkEmail(to: string, verifyUrl: string): Promise<SendResult> {
  if (!RESEND_API_KEY || !MAIL_FROM) {
    console.log('[mailer] Missing RESEND_API_KEY or MAIL_FROM; logging URL instead:', { to, verifyUrl });
    return { ok: false, error: 'missing-config' };
  }

  const subject = `${APP_NAME} – Sign in link`;
  const text = [`Hi,`, ``, `Click this link to sign in:`, verifyUrl, ``, `This link expires in 15 minutes.`, ``, `If you didn’t request this, you can ignore this email.`, ``, `— ${APP_NAME}`].join(
    '\n',
  );

  const html = `
    <div style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial;">
      <p>Hi,</p>
      <p>Click the button below to sign in. This link expires in 15 minutes.</p>
      <p>
        <a href="${verifyUrl}" 
           style="display:inline-block;padding:10px 16px;border-radius:8px;border:1px solid #e5e7eb;text-decoration:none;">
          Sign in to ${APP_NAME}
        </a>
      </p>
      <p>Or paste this URL into your browser:</p>
      <p><code>${verifyUrl}</code></p>
      <p style="color:#6b7280">If you didn’t request this, you can ignore this email.</p>
      <p>— ${APP_NAME}</p>
    </div>
  `.trim();

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to,
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[mailer] Resend error', res.status, body);
      return { ok: false, error: `resend-${res.status}` };
    }

    return { ok: true };
  } catch (err: any) {
    console.error('[mailer] Network/unknown error', err?.message || err);
    return { ok: false, error: 'network' };
  }
}

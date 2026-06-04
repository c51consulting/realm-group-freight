// Lightweight Resend wrapper. No-ops gracefully if RESEND_API_KEY is missing,
// so previews and tests don't fail.

interface SendArgs {
  to: string | string[];
  from?: string;
  reply_to?: string;
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

const DEFAULT_FROM =
  process.env.RESEND_FROM_EMAIL || 'REALM Group <no-reply@realmgroup.global>';

export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY missing; skipping send for', args.subject);
    return { ok: false, error: 'email_not_configured' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: args.from || DEFAULT_FROM,
        to: Array.isArray(args.to) ? args.to : [args.to],
        bcc: args.bcc,
        reply_to: args.reply_to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[email] Resend error', res.status, json);
      return { ok: false, error: json?.message || `http_${res.status}` };
    }
    return { ok: true, id: json?.id };
  } catch (err: any) {
    console.error('[email] Resend exception', err);
    return { ok: false, error: err?.message || 'unknown' };
  }
}

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

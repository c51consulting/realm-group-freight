import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSb } from '@supabase/supabase-js';
import { sendEmail, escapeHtml } from '@/lib/email/resend';

const Body = z.object({
  claimed_business_name: z.string().min(2).max(200),
  claimed_abn: z.string().max(20).nullable().optional(),
  contact_role: z.string().min(1).max(40),
  evidence_notes: z.string().max(2000).nullable().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch (err: any) {
    return NextResponse.json({ error: 'invalid_input', details: err?.errors }, { status: 400 });
  }

  const { data: carrier, error: cErr } = await supabase
    .from('carrier_directory')
    .select('id, slug, operator_name, email, claimed_by_carrier_id')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .maybeSingle();
  if (cErr || !carrier) return NextResponse.json({ error: 'carrier_not_found' }, { status: 404 });
  if (carrier.claimed_by_carrier_id) {
    return NextResponse.json({ error: 'already_claimed' }, { status: 409 });
  }

  const verificationEmail = carrier.email;
  const token = randomBytes(24).toString('hex');

  const { data: claim, error: insErr } = await supabase
    .from('carrier_directory_claims')
    .upsert(
      {
        directory_id: carrier.id,
        user_id: user.id,
        claimed_business_name: payload.claimed_business_name,
        claimed_abn: payload.claimed_abn ?? null,
        contact_role: payload.contact_role,
        evidence_notes: payload.evidence_notes ?? null,
        verification_token: token,
        verification_email: verificationEmail ?? 'pending-admin-review@realmgroup.global',
        status: 'pending',
      },
      { onConflict: 'directory_id,user_id' },
    )
    .select('id, verification_token')
    .single();

  if (insErr || !claim) {
    console.error('[carriers/claim] insert error', insErr);
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  }

  // Send the verification email to the listed contact email
  if (verificationEmail && /@/.test(verificationEmail)) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://realm-ag-marketplace-production.up.railway.app';
    const verifyUrl = `${appUrl}/carriers/${carrier.slug}/verify-claim?token=${claim.verification_token}`;
    await sendEmail({
      to: verificationEmail,
      subject: `[REALM] Confirm ownership of ${carrier.operator_name} on REALM Group AU`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width:560px; color:#111;">
          <h2 style="margin:0 0 12px;">Confirm your REALM listing</h2>
          <p>${escapeHtml(payload.claimed_business_name)} has requested to claim the listing for
          <strong>${escapeHtml(carrier.operator_name)}</strong> on the REALM Group AU carrier directory.</p>
          <p>If this is you (or someone authorised at your business), click the button below to confirm.
          The link is valid for 7 days.</p>
          <p style="margin:24px 0;">
            <a href="${verifyUrl}" style="background:#0F766E; color:#fff; padding:12px 18px; border-radius:8px; text-decoration:none; font-weight:600;">Confirm ownership</a>
          </p>
          <p style="font-size:13px; color:#555;">Or copy this link: <br><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p style="font-size:13px; color:#555;">If you didn&rsquo;t expect this, ignore the email and the request will expire.</p>
          <hr style="border:none; border-top:1px solid #eee; margin:18px 0;">
          <p style="font-size:12px; color:#999;">REALM Group · Australia</p>
        </div>`,
      text:
        `Confirm your REALM listing\n\n${payload.claimed_business_name} has requested to claim ${carrier.operator_name} on REALM.\n\nConfirm: ${verifyUrl}\n\nIgnore this email if it wasn't you.`,
    });
  }

  // Notify admins (best-effort)
  const adminEmail = process.env.REALM_ADMIN_EMAIL;
  if (adminEmail) {
    const needsManualReview = !verificationEmail || !/@/.test(verificationEmail);
    const flag = needsManualReview
      ? '<p style="background:#FEF3C7;border:1px solid #F59E0B;padding:10px;border-radius:6px;color:#92400E;"><strong>MANUAL REVIEW REQUIRED</strong> \u2014 no verification email on this listing. Please contact the claimant to confirm ownership before approving.</p>'
      : `<p>Verification link sent to <strong>${escapeHtml(verificationEmail)}</strong>.</p>`;
    await sendEmail({
      to: adminEmail,
      subject: needsManualReview
        ? `[REALM admin] MANUAL REVIEW \u2014 Carrier claim: ${carrier.operator_name}`
        : `[REALM admin] Carrier claim: ${carrier.operator_name}`,
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:560px;color:#111;">
          <h3 style="margin:0 0 8px;">Carrier claim submitted</h3>
          ${flag}
          <table style="font-size:14px;margin-top:12px;">
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Listing</td><td>${escapeHtml(carrier.operator_name)} (<code>${escapeHtml(carrier.slug)}</code>)</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Claimed by</td><td>${escapeHtml(payload.claimed_business_name)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Role</td><td>${escapeHtml(payload.contact_role)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">ABN</td><td>${escapeHtml(payload.claimed_abn || '\u2014')}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">User</td><td>${escapeHtml(user.email || user.id)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Notes</td><td>${escapeHtml(payload.evidence_notes || '\u2014')}</td></tr>
          </table>
        </div>`,
    });
  }

  return NextResponse.json({ ok: true, claim_id: claim.id });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSb } from '@supabase/supabase-js';
import { sendEmail, escapeHtml } from '@/lib/email/resend';

const Body = z.object({
  directory_id: z.string().uuid(),
  sender_name: z.string().min(1).max(200),
  sender_email: z.string().email().max(200),
  sender_phone: z.string().max(40).nullable().optional(),
  sender_company: z.string().max(200).nullable().optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  freight_type: z.string().max(40).nullable().optional(),
  origin_region: z.string().max(120).nullable().optional(),
  destination_region: z.string().max(120).nullable().optional(),
  estimated_quantity: z.string().max(80).nullable().optional(),
  pickup_date: z.string().max(20).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch (err: any) {
    return NextResponse.json({ error: 'invalid_input', details: err?.errors }, { status: 400 });
  }

  // Look up the carrier listing (must be published)
  const { data: carrier, error: cErr } = await supabase
    .from('carrier_directory')
    .select('id, operator_name, email, claimed_by_carrier_id, slug')
    .eq('id', payload.directory_id)
    .eq('is_published', true)
    .maybeSingle();
  if (cErr || !carrier) {
    return NextResponse.json({ error: 'carrier_not_found' }, { status: 404 });
  }

  // Insert the message (RLS allows: sender_user_id = auth.uid())
  const { data: inserted, error: insErr } = await supabase
    .from('carrier_directory_messages')
    .insert({
      directory_id: carrier.id,
      sender_user_id: user.id,
      sender_name: payload.sender_name,
      sender_email: payload.sender_email,
      sender_phone: payload.sender_phone ?? null,
      sender_company: payload.sender_company ?? null,
      subject: payload.subject,
      message: payload.message,
      freight_type: payload.freight_type ?? null,
      origin_region: payload.origin_region ?? null,
      destination_region: payload.destination_region ?? null,
      estimated_quantity: payload.estimated_quantity ?? null,
      pickup_date: payload.pickup_date || null,
    })
    .select('id')
    .single();

  if (insErr || !inserted) {
    console.error('[carriers/contact] insert error', insErr);
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  }

  // Email delivery (best-effort). Use service role only to bypass RLS for the email-status update.
  const carrierEmail = carrier.email;
  let emailResult: { ok: boolean; id?: string; error?: string } = { ok: false, error: 'no_email_on_file' };

  if (carrierEmail && /@/.test(carrierEmail)) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://realm-ag-marketplace-production.up.railway.app';
    const profileUrl = `${appUrl}/carriers/${carrier.slug}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#111; max-width:560px;">
        <h2 style="margin:0 0 12px;">New freight enquiry from REALM</h2>
        <p style="margin:0 0 16px; color:#555;">You've received an enquiry through your listing on the REALM Group AU carrier directory.</p>
        <table style="width:100%; border-collapse:collapse; font-size:14px; margin-bottom:16px;">
          <tr><td style="padding:6px 0; color:#666; width:140px;">From</td><td>${escapeHtml(payload.sender_name)}${payload.sender_company ? ` · ${escapeHtml(payload.sender_company)}` : ''}</td></tr>
          <tr><td style="padding:6px 0; color:#666;">Email</td><td><a href="mailto:${escapeHtml(payload.sender_email)}">${escapeHtml(payload.sender_email)}</a></td></tr>
          ${payload.sender_phone ? `<tr><td style="padding:6px 0; color:#666;">Phone</td><td>${escapeHtml(payload.sender_phone)}</td></tr>` : ''}
          ${payload.freight_type ? `<tr><td style="padding:6px 0; color:#666;">Freight type</td><td>${escapeHtml(payload.freight_type)}</td></tr>` : ''}
          ${payload.origin_region ? `<tr><td style="padding:6px 0; color:#666;">Origin</td><td>${escapeHtml(payload.origin_region)}</td></tr>` : ''}
          ${payload.destination_region ? `<tr><td style="padding:6px 0; color:#666;">Destination</td><td>${escapeHtml(payload.destination_region)}</td></tr>` : ''}
          ${payload.estimated_quantity ? `<tr><td style="padding:6px 0; color:#666;">Quantity</td><td>${escapeHtml(payload.estimated_quantity)}</td></tr>` : ''}
          ${payload.pickup_date ? `<tr><td style="padding:6px 0; color:#666;">Pickup</td><td>${escapeHtml(payload.pickup_date)}</td></tr>` : ''}
        </table>
        <p style="font-weight:600; margin:0 0 6px;">${escapeHtml(payload.subject)}</p>
        <div style="white-space:pre-wrap; background:#f7f7f8; padding:14px; border-radius:8px; font-size:14px; line-height:1.5;">${escapeHtml(payload.message)}</div>
        <p style="margin:18px 0 0; font-size:13px; color:#666;">Reply directly to this email to respond. <a href="${profileUrl}">View your listing on REALM</a> and claim it to manage enquiries inside the app.</p>
        <hr style="border:none; border-top:1px solid #eee; margin:20px 0;">
        <p style="font-size:12px; color:#999;">REALM Group · Australia · This enquiry was sent through your public carrier-directory listing.</p>
      </div>`;
    const text = [
      `New freight enquiry from REALM`,
      ``,
      `From: ${payload.sender_name}${payload.sender_company ? ` (${payload.sender_company})` : ''}`,
      `Email: ${payload.sender_email}`,
      payload.sender_phone ? `Phone: ${payload.sender_phone}` : '',
      payload.freight_type ? `Freight: ${payload.freight_type}` : '',
      payload.origin_region ? `Origin: ${payload.origin_region}` : '',
      payload.destination_region ? `Destination: ${payload.destination_region}` : '',
      payload.estimated_quantity ? `Quantity: ${payload.estimated_quantity}` : '',
      payload.pickup_date ? `Pickup: ${payload.pickup_date}` : '',
      ``,
      payload.subject,
      ``,
      payload.message,
      ``,
      `Reply to this email to respond. View listing: ${profileUrl}`,
    ].filter(Boolean).join('\n');

    emailResult = await sendEmail({
      to: carrierEmail,
      reply_to: payload.sender_email,
      bcc: payload.sender_email, // sender gets a copy
      subject: `[REALM] ${payload.subject}`,
      html,
      text,
    });
  }

  // Mark delivery status (service-role to bypass RLS on update)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    const admin = createSb(url, serviceKey, { auth: { persistSession: false } });
    await admin
      .from('carrier_directory_messages')
      .update({
        delivered_email: emailResult.ok,
        delivered_email_id: emailResult.id ?? null,
        delivered_error: emailResult.ok ? null : emailResult.error ?? null,
      })
      .eq('id', inserted.id);
  }

  return NextResponse.json({
    ok: true,
    message_id: inserted.id,
    email_delivered: emailResult.ok,
  });
}

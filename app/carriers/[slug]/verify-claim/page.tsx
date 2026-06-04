import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSb } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
  searchParams?: { token?: string };
}

export default async function VerifyClaimPage({ params, searchParams }: Props) {
  const token = searchParams?.token;
  if (!token) {
    return <Result kind="error" title="Missing token" message="The verification link appears to be incomplete." />;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return (
      <Result
        kind="error"
        title="Verification not configured"
        message="Server is missing credentials. Please try again later or contact support."
      />
    );
  }

  const admin = createSb(url, serviceKey, { auth: { persistSession: false } });

  // Look up the claim
  const { data: claim, error: cErr } = await admin
    .from('carrier_directory_claims')
    .select('id, directory_id, user_id, status, expires_at')
    .eq('verification_token', token)
    .maybeSingle();

  if (cErr || !claim) {
    return <Result kind="error" title="Invalid link" message="This verification link doesn’t match any pending claim." />;
  }
  if (claim.status === 'verified') {
    return <Result kind="ok" title="Already verified" message="This listing is already confirmed for you. You can manage it from the carrier dashboard." />;
  }
  if (new Date(claim.expires_at) < new Date()) {
    await admin.from('carrier_directory_claims').update({ status: 'expired' }).eq('id', claim.id);
    return <Result kind="error" title="Link expired" message="This verification link has expired. Submit a new claim to receive a fresh link." />;
  }

  // Fetch the carrier listing
  const { data: directory } = await admin
    .from('carrier_directory')
    .select('id, slug, operator_name')
    .eq('id', claim.directory_id)
    .maybeSingle();
  if (!directory) {
    return <Result kind="error" title="Listing not found" message="The listing for this claim is no longer available." />;
  }

  // Ensure there's a `carriers` row owned by the user; create one if absent
  // (this is the operational onboarding table).
  let carrierId: string | null = null;
  const { data: existing } = await admin
    .from('carriers')
    .select('id')
    .eq('owner_id', claim.user_id)
    .maybeSingle();
  if (existing) {
    carrierId = existing.id;
  } else {
    const { data: created } = await admin
      .from('carriers')
      .insert({
        owner_id: claim.user_id,
        business_name: directory.operator_name,
        status: 'pending_review',
      })
      .select('id')
      .single();
    carrierId = created?.id ?? null;
  }

  if (!carrierId) {
    return <Result kind="error" title="Could not create carrier" message="There was a problem linking your account. Contact support@realmgroup.global." />;
  }

  // Mark the directory listing as claimed and the claim verified
  await admin
    .from('carrier_directory')
    .update({
      claimed_by_carrier_id: carrierId,
      claimed_at: new Date().toISOString(),
    })
    .eq('id', directory.id);

  await admin
    .from('carrier_directory_claims')
    .update({ status: 'verified', verified_at: new Date().toISOString() })
    .eq('id', claim.id);

  return (
    <Result
      kind="ok"
      title={`✓ ${directory.operator_name} verified`}
      message="You now own this listing. New freight enquiries from REALM users will appear in your carrier dashboard, and you can edit your listing details there."
      cta={{ label: 'Go to carrier dashboard', href: '/carrier/dashboard' }}
    />
  );
}

function Result({
  kind,
  title,
  message,
  cta,
}: {
  kind: 'ok' | 'error';
  title: string;
  message: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div
        className={`rounded-lg border p-8 ${
          kind === 'ok' ? 'bg-green-50 border-green-200 text-green-900' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <h1 className="text-xl font-bold mb-2">{title}</h1>
        <p className="text-sm">{message}</p>
        {cta && (
          <Link href={cta.href} className="inline-block mt-5 bg-brand-600 hover:bg-brand-700 text-white text-sm px-5 py-2 rounded-md">
            {cta.label}
          </Link>
        )}
      </div>
      <Link href="/carriers" className="inline-block mt-5 text-sm text-brand-700 hover:underline">
        ← Back to directory
      </Link>
    </div>
  );
}

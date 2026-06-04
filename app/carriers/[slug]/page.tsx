import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CarrierContactForm from '@/components/carrier/CarrierContactForm';
import CarrierClaimButton from '@/components/carrier/CarrierClaimButton';
import CarrierDirectoryDisclaimer from '@/components/carrier/CarrierDirectoryDisclaimer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('carrier_directory')
    .select('operator_name, carrier_type, operating_regions')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .maybeSingle();
  if (!data) return { title: 'Carrier — REALM Group Freight' };
  return {
    title: `${data.operator_name} — REALM Carrier Directory`,
    description: `${data.operator_name}. ${data.carrier_type ?? ''} servicing ${data.operating_regions ?? 'Australia'}. Contact directly from the REALM marketplace.`,
  };
}

export default async function CarrierDetailPage({ params }: PageProps) {
  const supabase = await createClient();

  const { data: carrier, error } = await supabase
    .from('carrier_directory')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !carrier) return notFound();

  // Auth state for the contact form
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userProfile: { business_name: string | null; email: string | null; phone: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('business_name, email, phone')
      .eq('id', user.id)
      .maybeSingle();
    userProfile = data ?? null;
  }

  const websiteHref = carrier.website
    ? carrier.website.startsWith('http')
      ? carrier.website
      : `https://${carrier.website}`
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/carriers" className="text-sm text-brand-700 hover:underline mb-4 inline-block">
        ← Back to Carrier Directory
      </Link>

      <header className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">{carrier.operator_name}</h1>
            {carrier.carrier_type && (
              <p className="text-sm text-gray-600 mt-1">{carrier.carrier_type}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {carrier.verification_status === 'verified' && (
              <span className="inline-flex items-center text-xs font-bold uppercase tracking-wide bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
                ✓ Verified contact
              </span>
            )}
            {carrier.claimed_by_carrier_id && (
              <span className="inline-flex items-center text-xs font-bold uppercase tracking-wide bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-3 py-1">
                Claimed by operator
              </span>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-gray-700">
          {carrier.address && (
            <div>
              <dt className="text-xs uppercase text-gray-500">Address</dt>
              <dd>{carrier.address}</dd>
            </div>
          )}
          {carrier.operating_regions && (
            <div>
              <dt className="text-xs uppercase text-gray-500">Operating regions</dt>
              <dd>{carrier.operating_regions}</dd>
            </div>
          )}
          {carrier.equipment_and_services && (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase text-gray-500">Equipment & services</dt>
              <dd>{carrier.equipment_and_services}</dd>
            </div>
          )}
          {websiteHref && (
            <div>
              <dt className="text-xs uppercase text-gray-500">Website</dt>
              <dd>
                <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline break-all">
                  {carrier.website}
                </a>
              </dd>
            </div>
          )}
          {carrier.phone && (
            <div>
              <dt className="text-xs uppercase text-gray-500">Phone</dt>
              <dd>{carrier.phone}</dd>
            </div>
          )}
        </dl>
      </header>

      {/* Contact / claim section */}
      <section id="contact" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Contact this carrier</h2>
          <p className="text-sm text-gray-600 mb-5">
            Send {carrier.operator_name} a message about a freight enquiry. Messages are recorded inside REALM and
            delivered to the carrier&rsquo;s listed contact. They reply by email or, if they&rsquo;ve claimed this listing,
            directly inside REALM.
          </p>

          {user && userProfile ? (
            <CarrierContactForm
              directoryId={carrier.id}
              carrierName={carrier.operator_name}
              defaults={{
                name: userProfile.business_name ?? '',
                email: userProfile.email ?? user.email ?? '',
                phone: userProfile.phone ?? '',
                company: userProfile.business_name ?? '',
              }}
            />
          ) : (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
              <p className="font-medium mb-1">Sign in to contact this carrier</p>
              <p>
                We require a verified account before contacting carriers — this keeps the network clean and
                accountable for both sides.
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/login?next=/carriers/${carrier.slug}%23contact`}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-md"
                >
                  Sign in
                </Link>
                <Link
                  href={`/register?next=/carriers/${carrier.slug}%23contact`}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm px-4 py-2 rounded-md"
                >
                  Create account
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Side: Claim CTA */}
        <aside className="bg-gradient-to-br from-brand-50 to-white rounded-lg border border-brand-100 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-2">Is this your business?</h3>
          {carrier.claimed_by_carrier_id ? (
            <p className="text-sm text-gray-700">
              This listing has been claimed by its operator. They&rsquo;ll see and respond to your message directly in
              REALM.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-700 mb-4">
                Claim this listing to receive enquiries inside REALM, respond directly, manage your details, and
                unlock load-matching.
              </p>
              <CarrierClaimButton directorySlug={carrier.slug} listedEmail={carrier.email} />
            </>
          )}
        </aside>
      </section>

      <CarrierDirectoryDisclaimer variant="detail" />

      {/* Source attribution */}
      {carrier.source_urls && (
        <p className="mt-8 text-xs text-gray-500">
          Source: {carrier.source_urls.split(';').map((s: string, i: number) => {
            const url = s.trim();
            const safe = url.startsWith('http') ? url : `https://${url}`;
            return (
              <span key={i}>
                {i > 0 ? ', ' : ''}
                <a href={safe} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {url}
                </a>
              </span>
            );
          })}
        </p>
      )}
    </div>
  );
}

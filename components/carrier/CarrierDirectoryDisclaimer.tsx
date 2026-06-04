import Link from 'next/link';

interface Props {
  /** When 'detail', shows the "claim or remove" CTA inline. When 'index', shows the lighter summary. */
  variant?: 'detail' | 'index';
}

export default function CarrierDirectoryDisclaimer({ variant = 'index' }: Props) {
  return (
    <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5 text-xs text-gray-600 leading-relaxed">
      <p className="font-medium text-gray-900 mb-1">About this directory</p>
      <p>
        Listings are compiled from publicly available sources (carrier websites, public registries, industry
        directories) and are provided for informational purposes only. REALM Group does not endorse, certify,
        or guarantee the services, pricing, insurance coverage, or operational status of any listed carrier.
        Before engaging a carrier, verify their authority (e.g. NHVR accreditation, state operating
        permits, ABN, insurance) directly with the carrier and the relevant regulator.
      </p>
      {variant === 'detail' ? (
        <p className="mt-2">
          If this is your business and you&rsquo;d like to{' '}
          <span className="font-medium text-gray-900">update your listing, correct details, or have it removed</span>,
          use the &ldquo;Claim this listing&rdquo; button above, or email{' '}
          <a href="mailto:carriers@realmgroup.global" className="text-brand-700 hover:underline">
            carriers@realmgroup.global
          </a>
          .
        </p>
      ) : (
        <p className="mt-2">
          Listed carriers can{' '}
          <Link href="/carriers" className="text-brand-700 hover:underline">
            claim and edit their profile
          </Link>{' '}
          at any time, or request removal by emailing{' '}
          <a href="mailto:carriers@realmgroup.global" className="text-brand-700 hover:underline">
            carriers@realmgroup.global
          </a>
          .
        </p>
      )}
    </div>
  );
}

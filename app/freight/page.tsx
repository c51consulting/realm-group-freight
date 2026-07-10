import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'REALM Group Freight',
  description: 'REALM Group Freight matches paid agricultural loads to approved carriers behind the scenes.',
};

export default function FreightPage() {
  return (
    <div className="page-container">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">REALM Group Freight</h1>
          <p className="page-subtitle">
            Freight is arranged through REALM's private carrier network. Once a transaction is ready, matching
            carriers are notified directly and the first active carrier to accept is assigned.
          </p>
        </div>
        <Link href="/listings" className="btn-primary self-start sm:self-auto">
          Browse Marketplace
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900">No public carrier shopping</h2>
          <p className="text-sm text-gray-600 mt-2">
            Buyers and sellers do not need to browse carrier profiles or chase quotes manually.
          </p>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900">Matched alerts</h2>
          <p className="text-sm text-gray-600 mt-2">
            Approved carriers receive load alerts based on service regions, commodity categories and availability.
          </p>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900">First accept wins</h2>
          <p className="text-sm text-gray-600 mt-2">
            The first eligible carrier to accept gets the load, and the remaining alerts are closed.
          </p>
        </div>
      </div>

      <section className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Carrier operator?</h2>
          <p className="text-sm text-gray-600 mt-1">
            Join the carrier network to receive private load alerts matched to your routes and freight categories.
          </p>
        </div>
        <Link href="/carrier/onboard" className="btn-secondary whitespace-nowrap">Join carrier network</Link>
      </section>
    </div>
  );
}

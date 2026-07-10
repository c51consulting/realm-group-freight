import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'REALM Carrier Network',
  description:
    'REALM uses a private carrier network. Carriers are verified in the backend and notified when matched loads become available.',
};

export default function CarriersNetworkPage() {
  return (
    <div className="page-container">
      <section className="page-header max-w-4xl">
        <p className="text-sm font-semibold uppercase text-brand-700">Private carrier network</p>
        <h1 className="page-title mt-2">Freight is matched behind the scenes.</h1>
        <p className="page-subtitle">
          REALM does not operate a public carrier directory. Verified carriers register their coverage, fleet and
          commodity categories in the backend, then receive direct load alerts when a paid transaction matches their
          profile.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900">1. Carrier registers</h2>
          <p className="text-sm text-gray-600 mt-2">
            Carriers submit business, compliance, service region and commodity details for review.
          </p>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900">2. Load is matched</h2>
          <p className="text-sm text-gray-600 mt-2">
            When a transaction needs freight, REALM matches active carriers by location and load category.
          </p>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900">3. First accept wins</h2>
          <p className="text-sm text-gray-600 mt-2">
            Matched carriers receive direct alerts. The first active carrier to accept is assigned the load.
          </p>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Want to haul REALM loads?</h2>
          <p className="text-sm text-gray-600 mt-1">
            Join the network, choose your service regions and categories, and receive matched load alerts after approval.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/carrier/onboard" className="btn-primary whitespace-nowrap">Join carrier network</Link>
          <Link href="/carrier/dashboard" className="btn-secondary whitespace-nowrap">Carrier dashboard</Link>
        </div>
      </section>
    </div>
  );
}

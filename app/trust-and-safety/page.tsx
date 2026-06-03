import React from 'react';
import { APP_NAME } from '@/lib/constants';

export const metadata = {
  title: 'Trust & Safety',
  description: `How ${APP_NAME} protects buyers, sellers and carriers — funds held in trust, AFIA-verified quality, weighbridge integration, and dispute resolution.`,
};

export default function TrustAndSafetyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Trust &amp; Safety at {APP_NAME}</h1>
      <p className="text-sm text-gray-500 mb-10">Effective date: 3 June 2026</p>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Payments Held in Trust</h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          Every paid transaction on {APP_NAME} flows through Stripe Connect Standard. Buyer funds are held by Stripe until the order&apos;s release conditions are met (typically delivery confirmation plus a weighbridge match where applicable). A 5% platform fee and standard Stripe processing fees apply at release. GST applies where required.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Funds are never commingled with REALM operating accounts. You can review the full release timeline on each order page.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">2. Verified Identity (KYC)</h2>
        <p className="text-gray-600 leading-relaxed">
          Sellers and carriers complete Stripe Identity verification before they can receive payouts. We verify business legal name, ABN, and beneficial ownership where required. We never see or store your bank credentials — those go directly to Stripe.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">3. Verified Quality Testing</h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          Listings can carry one of three quality tiers:
        </p>
        <ul className="list-disc pl-6 text-gray-600 space-y-1 leading-relaxed">
          <li><strong>Basic</strong> — seller-declared, optionally backed by on-farm NIR readings.</li>
          <li><strong>Verified</strong> — independent lab feed test attached.</li>
          <li><strong>Performance</strong> — mandatory AFIA-graded lab test with documentation attached.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">4. Weighbridge Integration</h2>
        <p className="text-gray-600 leading-relaxed">
          Where the loader has a certified weighbridge, gross/tare/net weights are captured directly and attached to the order. Buyers pay for delivered net weight, not listed weight. Disputes that involve a weight delta of more than 2% trigger an automatic review.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">5. Dispute Resolution — 48-Hour SLA</h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          Open a dispute from the order page within 48 hours of delivery. Our team reviews weighbridge data, in-app messages, proof-of-delivery photos and grade documentation, and issues a non-binding resolution within 48 hours.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Funds in trust are not released until the dispute is closed. Either party may decline our non-binding resolution and pursue formal legal remedies under the Australian Consumer Law per our Terms of Service.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">6. Carrier &amp; Freight Safety</h2>
        <p className="text-gray-600 leading-relaxed">
          Carriers must hold a valid NHVR accreditation where applicable, current insurance, and any State permits required for the cargo type. Carriers attest to Chain of Responsibility compliance at booking time. Livestock carriers must comply with the Australian Animal Welfare Standards and Guidelines for the Land Transport of Livestock.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">7. Reporting Fraud or Abuse</h2>
        <p className="text-gray-600 leading-relaxed">
          If you see a suspicious listing, an attempt to take the conversation off-platform, or a request to pay outside Stripe, report it via the Report button on the listing, or email <a className="text-brand-600" href="mailto:trust@realmgroup.global">trust@realmgroup.global</a>. We action confirmed reports within 24 hours, typically with account suspension.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">8. What we cannot do</h2>
        <p className="text-gray-600 leading-relaxed">
          {APP_NAME} is a venue, not a guarantor. We do not own, inspect, transport, or warrant any listing. We cannot guarantee outcomes outside the funds-in-trust mechanism. Read our <a className="text-brand-600" href="/terms">Terms of Service</a> for the full picture.
        </p>
      </section>
    </div>
  );
}

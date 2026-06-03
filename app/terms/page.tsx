import React from 'react';
import { APP_NAME } from '@/lib/constants';

export const metadata = {
  title: 'Terms of Service',
  description: `Terms of Service for ${APP_NAME} — Australia's agricultural marketplace.`,
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8 prose prose-brand">
      <h1>Terms of Service</h1>
      <p className="text-sm text-gray-500">Effective date: 3 June 2026</p>

      <p>
        These Terms of Service (the &quot;Terms&quot;) govern your access to and use of {APP_NAME} (the &quot;Platform&quot;), operated by REALM Group Global Pty Ltd (&quot;REALM&quot;, &quot;we&quot;, &quot;us&quot;). By creating an account or using the Platform you agree to be bound by these Terms. If you do not agree, do not use the Platform.
      </p>

      <h2>1. Eligibility &amp; Accounts</h2>
      <ul>
        <li>You must be at least 18 years old and able to enter into a binding contract.</li>
        <li>You must provide accurate registration information, including a valid Australian Business Number (ABN) where you list as a seller.</li>
        <li>You are responsible for safeguarding your credentials and for all activity under your account.</li>
      </ul>

      <h2>2. The Platform — what it is, and what it is not</h2>
      <p>
        {APP_NAME} is a venue that connects buyers and sellers of agricultural commodities, livestock, equipment and freight services across Australia. We are <strong>not</strong> a party to any transaction between users. We do not own, inspect, grade, warehouse, transport, or warrant any listing.
      </p>

      <h2>3. Listings, Offers &amp; Orders</h2>
      <ul>
        <li>Sellers are solely responsible for the accuracy, legality and quality of their listings, including weights, AFIA grades, origin, biosecurity status (including NLIS/PIC compliance for livestock), and regulatory compliance.</li>
        <li>Buyers are responsible for reviewing listings, performing due diligence, and inspecting goods at or before delivery.</li>
        <li>An accepted offer or completed checkout creates a contract directly between the buyer and the seller. {APP_NAME} is not a party to that contract.</li>
      </ul>

      <h2>4. Payments Held in Trust</h2>
      <p>
        Buyer funds are collected and held by our payment processor, Stripe Payments Australia Pty Ltd, until the order&apos;s &quot;funds release&quot; conditions are met (delivery confirmation and weighbridge verification where applicable). {APP_NAME} charges a platform fee of 5% of the transaction value, deducted at the time of release. Stripe processing fees are additional. GST is applied where applicable.
      </p>

      <h2>5. Australian Consumer Law</h2>
      <p>
        Nothing in these Terms excludes, restricts or modifies any consumer guarantee, right or remedy under the Competition and Consumer Act 2010 (Cth) or any other law that cannot lawfully be excluded. Where our liability for failure to comply with a consumer guarantee can be limited, our liability is limited (at our option) to re-supplying the relevant services or paying the cost of re-supply.
      </p>

      <h2>6. Disputes Between Users</h2>
      <p>
        Disputes about quality, quantity, freight or payment must first be raised through the in-platform dispute process within 48 hours of delivery. We will review weighbridge data, photographs and chat history and issue a non-binding resolution. Either party may still pursue legal remedies; {APP_NAME} is not an arbitrator and accepts no liability for the outcome.
      </p>

      <h2>7. Prohibited Use</h2>
      <ul>
        <li>Fraudulent, misleading or off-platform circumvention listings.</li>
        <li>Sale of goods prohibited under Commonwealth or State law (including controlled substances, unregistered agvet chemicals, embargoed goods).</li>
        <li>Infringement of intellectual property or third-party rights.</li>
        <li>Scraping, reverse engineering, or abusing the Platform&apos;s APIs.</li>
      </ul>

      <h2>8. Carriers &amp; Freight</h2>
      <p>
        Carriers using the Platform must hold all required NHVR accreditations, insurance, and State permits, and must comply with the Heavy Vehicle National Law (HVNL) and Chain of Responsibility obligations. Livestock carriers must comply with relevant Land Transport Standards. {APP_NAME} is not a freight forwarder, broker, or carrier.
      </p>

      <h2>9. Disclaimer &amp; Limitation of Liability</h2>
      <p>
        Subject to §5 (Australian Consumer Law), the Platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the maximum extent permitted by law, REALM disclaims all warranties not expressly granted in these Terms. REALM&apos;s total aggregate liability arising from or relating to these Terms or your use of the Platform shall not exceed the greater of (A) AUD $500 or (B) the platform fees you paid to REALM in the twelve months preceding the claim.
      </p>

      <h2>10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless REALM, its officers, directors, employees and agents from any claim arising out of (i) your breach of these Terms, (ii) your listings, offers or transactions on the Platform, or (iii) your violation of any law or third-party right.
      </p>

      <h2>11. Governing Law &amp; Venue</h2>
      <p>
        These Terms are governed by the laws of the State of Victoria, Australia. The parties submit to the exclusive jurisdiction of the courts of Victoria and the courts competent to hear appeals therefrom.
      </p>

      <h2>12. Termination</h2>
      <p>
        We may suspend or terminate your account at any time for breach of these Terms, suspected fraud, or risk to other users. You may close your account at any time; obligations relating to open orders and accrued fees survive termination.
      </p>

      <h2>13. Changes</h2>
      <p>
        We may update these Terms from time to time. Material changes will be notified by email or in-platform notice at least 14 days before they take effect. Continued use of the Platform after the effective date constitutes acceptance.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about these Terms? Contact us at <a href="/contact">/contact</a> or legal@realmgroup.global.
      </p>
    </div>
  );
}

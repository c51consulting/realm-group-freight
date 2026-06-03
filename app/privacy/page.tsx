import React from 'react';
import { APP_NAME } from '@/lib/constants';

export const metadata = {
  title: 'Privacy Policy',
  description: `Privacy Policy for ${APP_NAME} — handling of personal information under the Privacy Act 1988 (Cth) and the Australian Privacy Principles.`,
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8 prose prose-brand">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-gray-500">Effective date: 3 June 2026</p>

      <p>
        {APP_NAME} (operated by REALM Group Global Pty Ltd, &quot;REALM&quot;, &quot;we&quot;, &quot;us&quot;) is committed to protecting your personal information. We handle personal information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Account information:</strong> name, email, phone, business name, ABN, role (buyer, seller, carrier).</li>
        <li><strong>Identity &amp; compliance:</strong> data required to onboard you to Stripe Connect (legal name, date of birth where required, address). This data is collected by Stripe directly; we receive only confirmation status.</li>
        <li><strong>Transaction data:</strong> listings, offers, orders, freight bookings, weighbridge events, AFIA grades, photographs and documents you upload.</li>
        <li><strong>Communications:</strong> in-platform messages, support tickets, and notes related to disputes.</li>
        <li><strong>Usage data:</strong> IP address, device and browser information, pages visited, cookies and similar technologies.</li>
        <li><strong>Location data:</strong> the pickup/delivery addresses on listings, and (with your permission) device coordinates on proof-of-delivery uploads.</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To operate the marketplace and complete the transactions you direct.</li>
        <li>To verify identity, prevent fraud, and comply with Australian sanctions and anti-money-laundering laws (AML/CTF Act 2006).</li>
        <li>To send transactional emails, dispute notices and security alerts.</li>
        <li>To improve the Platform — analytics, debugging, A/B testing.</li>
        <li>To send marketing only where you have opted in (Spam Act 2003 compliance); you can unsubscribe at any time.</li>
      </ul>

      <h2>3. Who we share with</h2>
      <ul>
        <li><strong>Payment processor:</strong> Stripe Payments Australia Pty Ltd (transaction, identity verification).</li>
        <li><strong>Hosting &amp; infrastructure:</strong> Railway / Vercel (web hosting), Supabase Inc. (database and authentication).</li>
        <li><strong>Communications:</strong> Resend / Postmark (transactional email), Twilio (SMS) where used.</li>
        <li><strong>Counterparties:</strong> when you transact with another user, we share the information necessary to complete the transaction.</li>
        <li><strong>Legal:</strong> when required by law, court order, or to protect rights, safety or property.</li>
        <li>We do not sell your personal information.</li>
      </ul>

      <h2>4. Overseas disclosure</h2>
      <p>
        Some of our service providers (Stripe, Supabase, Vercel, Resend) are based in the United States or other overseas jurisdictions. By using the Platform you consent to the overseas disclosure of your personal information to these providers for the purposes described above.
      </p>

      <h2>5. Retention</h2>
      <p>
        We retain account and transaction records for as long as your account is active and for up to 7 years afterwards to meet Australian tax and audit requirements. Identity verification records are retained per Stripe&apos;s policy. You can request deletion (see §7) — we will honour the request except where law requires retention.
      </p>

      <h2>6. Security</h2>
      <p>
        We use industry-standard safeguards: TLS in transit, encryption at rest (Supabase managed), row-level security on tenant data, scoped API keys, and access logging.
      </p>

      <h2>7. Your rights — Australian Privacy Principles</h2>
      <p>
        You have the right to:
      </p>
      <ul>
        <li>Access the personal information we hold about you (APP 12).</li>
        <li>Request correction of inaccurate personal information (APP 13).</li>
        <li>Request deletion, subject to legal retention obligations.</li>
        <li>Opt out of direct marketing at any time.</li>
        <li>Complain about a breach of the APPs (see §8).</li>
      </ul>
      <p>
        To exercise a right, email privacy@realmgroup.global with the subject line &quot;Privacy Request&quot;. We will respond within 30 days.
      </p>

      <h2>8. Complaints</h2>
      <p>
        If you believe we have breached the APPs, contact us first at privacy@realmgroup.global. If you are not satisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at <a href="https://www.oaic.gov.au" target="_blank" rel="noreferrer">www.oaic.gov.au</a> or by calling 1300 363 992.
      </p>

      <h2>9. Children</h2>
      <p>
        The Platform is not directed to children under 18 and we do not knowingly collect their personal information.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update this Policy. Material changes will be notified by email or in-platform notice at least 14 days before they take effect.
      </p>

      <h2>11. Contact</h2>
      <p>
        Privacy questions? <a href="/contact">/contact</a> or privacy@realmgroup.global.
      </p>
    </div>
  );
}

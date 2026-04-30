import React from 'react';
import { APP_NAME } from '@/lib/constants';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8 prose prose-brand">
      <h1>Terms of Service</h1>
      <p>
        These Terms govern your use of {APP_NAME}. By accessing the platform you
        agree to these Terms.
      </p>
      <h2>Accounts</h2>
      <p>
        You must provide accurate information when creating an account and keep
        your credentials secure.
      </p>
      <h2>Listings and Orders</h2>
      <p>
        Sellers are responsible for the accuracy of their listings. Buyers are
        responsible for reviewing listings before placing offers. Funds are held
        in trust through our payment provider until delivery is verified.
      </p>
      <h2>Prohibited Use</h2>
      <ul>
        <li>Fraudulent or misleading listings.</li>
        <li>Infringement of intellectual property or third-party rights.</li>
        <li>Any activity that violates applicable law.</li>
      </ul>
      <h2>Liability</h2>
      <p>
        {APP_NAME} is provided on an &quot;as is&quot; basis. To the maximum
        extent permitted by law, we exclude implied warranties and are not
        liable for indirect or consequential loss.
      </p>
      <h2>Changes</h2>
      <p>
        We may update these Terms from time to time. Continued use of the
        platform after changes constitutes acceptance of the updated Terms.
      </p>
    </div>
  );
}


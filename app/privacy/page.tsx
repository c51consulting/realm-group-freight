import React from 'react';
import { APP_NAME } from '@/lib/constants';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8 prose prose-brand">
      <h1>Privacy Policy</h1>
      <p>
        {APP_NAME} respects your privacy. This page describes what information we
        collect and how we use it.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>Account information (name, email, phone, business details).</li>
        <li>Listing and transaction data you submit to the marketplace.</li>
        <li>Usage data, device data, and cookies to improve the service.</li>
      </ul>
      <h2>How we use information</h2>
      <ul>
        <li>To operate the marketplace and process transactions.</li>
        <li>To verify quality data (weighbridge, grading, feed tests).</li>
        <li>To communicate with you about your account and orders.</li>
      </ul>
      <h2>Sharing</h2>
      <p>
        We share information only with providers required to deliver the service
        (payment processors, logistics partners) and where required by law.
      </p>
      <h2>Contact</h2>
      <p>
        For privacy questions, contact us via the{' '}
        <a href="/contact">contact page</a>.
      </p>
    </div>
  );
}


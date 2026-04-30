import React from 'react';
import { APP_NAME } from '@/lib/constants';

export default function TrustAndSafetyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Trust & Safety at {APP_NAME}</h1>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Payments Held in Trust</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          To ensure a secure trading environment for both buyers and sellers, {APP_NAME} uses a "held in trust" payment model. When a buyer pays for a listing, the funds are securely held by REALM Group Global until the delivery is confirmed and verified against weighbridge data.
        </p>
        <p className="text-gray-600 leading-relaxed">
          This protects buyers from non-delivery and ensures sellers are paid promptly once the transaction is successfully completed.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Verified Weighbridge Data</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Accuracy is critical in agricultural trading. Our platform integrates with weighbridge data to verify the exact quantity of materials delivered. This ensures that the final payment reflects the actual weight received, reducing disputes and increasing transparency.
        </p>
      </section>
    </div>
  );
}

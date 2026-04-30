import React from 'react';
import { APP_NAME } from '@/lib/constants';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">About {APP_NAME}</h1>
      <div className="prose prose-brand max-w-none text-gray-600">
        <p className="text-lg mb-8">
          {APP_NAME} is Australia's premier digital marketplace for agricultural trading. We connect farmers, producers, and buyers in a secure, transparent, and efficient environment.
        </p>
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p>
            Our mission is to modernize agricultural trading by providing tools that ensure fair pricing, guaranteed payments, and verified quality. We believe that technology can empower the agricultural community by reducing risk and increasing market access.
          </p>
        </section>
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Secure Payments:</strong> Funds are held in trust until delivery is verified.</li>
            <li><strong>Verified Data:</strong> Integration with weighbridge data for accurate quantity tracking.</li>
            <li><strong>Quality Assurance:</strong> Support for AFIA grading and lab-verified feed tests.</li>
            <li><strong>Efficient Logistics:</strong> Tools to manage freight and delivery schedules.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

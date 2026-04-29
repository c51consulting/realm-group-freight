import React from 'react';
import { APP_NAME } from '@/lib/constants';

export default function TermsPage() {
    return (
          <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Terms of Service</h1>h1>
                
                <div className="prose prose-brand max-w-none text-gray-600">
                        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>p>
                        
                        <section className="mb-8">
                                  <h2 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>h2>
                                  <p>
                                              By accessing or using {APP_NAME}, you agree to be bound by these Terms of Service and all applicable laws and regulations. 
                                              If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                                  </p>p>
                        </section>section>
                
                        <section className="mb-8">
                                  <h2 className="text-xl font-bold text-gray-900 mb-4">2. Marketplace Services</h2>h2>
                                  <p>
                                    {APP_NAME} provides a platform for the trading of agricultural materials, livestock, and equipment. 
                                              We act as a facilitator and do not take ownership of the goods traded on the platform.
                                  </p>p>
                        </section>section>
                
                        <section className="mb-8">
                                  <h2 className="text-xl font-bold text-gray-900 mb-4">3. Payments and Trust Account</h2>h2>
                                  <p>
                                              All payments made through the platform are held in trust by REALM Group Global. 
                                              Funds are released to the seller only after delivery has been confirmed and verified. 
                                      </div>

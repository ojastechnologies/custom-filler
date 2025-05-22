import React from 'react';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';

export const metadata = {
  title: 'Shipping Policy | Custom Filler',
  description: 'Our shipping policy and delivery information for Custom Filler products and services.'
};

export default function ShippingPolicyPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Shipping Policy
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 prose dark:prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Our Shipping Policy is as Follows:
            </h2>
            
            <ul className="space-y-4 text-gray-700 dark:text-gray-300">
              <li>
                All products that are paid for are shipped within 5 business days of payment if they are in stock.
              </li>
              
              <li>
                If inventory is not in stock, we will contact you by email, and keep you notified as when we will be able to ship your products to you. Once items are in stock, we will contact you to make immediate shipment.
              </li>
              
              <li>
                Being that our products are generally shipped under a low category of hazardous freight, generally UN1950, Non-Flammable, we are required to ship by a parcel carrier that we are registered with to do so, and this includes United Parcel Service (UPS), Federal Express (FedEx), or any other freight carrier that is licensed to carry our product by the case or by the pallet.
              </li>
              
              <li>
                United State Postal Service (USPS) is not allowed to carry our packages as they will not transport any Dangerous Goods and it is a part of their doctrine to not do so.
              </li>
              
              <li>
                We believe that all reasonable efforts are made to ensure each and every shipment arrives in your hands safely and as you ordered it. If unforeseen problems such as weather, occurrence with the carrier, or with any other unforeseen problem and our ability to ship your products are delayed, feel free to contacts us.
              </li>
              
              <li>
                We will make every effort to ensure your shipment meets your expected delivery requirements. We at Aero Tech Labs, Inc., will strive to make your purchase experience as easy and problem free as possible.
              </li>
            </ul>
          </div>
          
          <div className="mt-8 bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Have questions about our Shipping Policy?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you have any questions or concerns about our shipping practices, please don&apos;t hesitate to contact us.
            </p>
            <div className="flex justify-center">
              <Link 
                href="/contact-us" 
                className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
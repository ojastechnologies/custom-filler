import React from 'react';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';

export const metadata = {
  title: 'Terms and Conditions | Custom Filler',
  description: 'Terms and conditions for using Custom Filler products and services, including our refund and returns policy.'
};

export default function TermsAndConditionsPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Terms and Conditions
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Refund and Returns Policy
              </h2>
              
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  We only replace items if they are defective or damaged
                </p>
              </div>
              
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <p>
                  Our refund and returns policy lasts 30 days. If 30 days have passed since your purchase, we can&apos;t offer you an exchange.
                </p>
                
                <p>
                  To be eligible for a return, your item must also be in the original packaging and marked appropriately.
                </p>
                
                <p>
                  To complete your return, we require a receipt or proof of purchase.
                </p>
              </div>
              
              <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                      Please do not send your purchase back to us unless we have been contacted and we issue you a Return Authorization.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Return Process
              </h3>
              
              <ol className="list-decimal pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  Once your return is received and inspected, we will send you an email to notify you that we have received your returned item.
                </li>
                <li>
                  We will also notify you of the approval or rejection of your refund.
                </li>
                <li>
                  If you are approved, then your refund or replacement will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days.
                </li>
              </ol>
            </div>
            
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Sale Items
              </h3>
              
              <p className="text-gray-700 dark:text-gray-300">
                Only regular priced items may be refunded. Sale items cannot be refunded.
              </p>
            </div>
            
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Exchange Process
              </h3>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We only replace items if they are defective or damaged. If you need to exchange it for the same item, send us an email at <a href="mailto:info@customfiller.com" className="text-primary-600 dark:text-primary-400 hover:underline">info@customfiller.com</a> and after we issue a Return Authorization, then you can send your item to:
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4">
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  Aero Tech Labs, Inc.<br />
                  728 Northwest 7th Terrace<br />
                  Fort Lauderdale, FL., 33311
                </p>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300">
                To return your product, you should ship by UPS or FEDEX Ground only to the address above.
              </p>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Shipping Costs
              </h3>
              
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <p>
                  You will be responsible for paying for your own shipping costs to return your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.
                </p>
                
                <p>
                  Depending on where you live, the time it may take for your exchanged product to reach you may vary.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              General Terms
            </h2>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              By accessing and placing an order with Custom Filler, you confirm that you are in agreement with and bound by the terms and conditions contained in the Terms Of Use outlined below. These terms apply to the entire website and any email or other type of communication between you and Custom Filler.
            </p>
            
            <p className="text-gray-700 dark:text-gray-300">
              Under no circumstances shall Custom Filler team be liable for any direct, indirect, special, incidental or consequential damages, including, but not limited to, loss of data or profit, arising out of the use, or the inability to use, the materials on this site, even if Custom Filler team or an authorized representative has been advised of the possibility of such damages.
            </p>
          </div>
          
          <div className="mt-8 bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Have questions about our Terms and Conditions?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you have any questions or concerns about our terms, please don&apos;t hesitate to contact us.
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
          
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
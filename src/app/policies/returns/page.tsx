import React from 'react';
import Layout from '@/components/layout/Layout';

export const metadata = {
  title: 'Return and Refund Policy | Custom Filler',
  description: 'Our return and refund policy for Custom Filler products and services.'
};

export default function ReturnAndRefundPolicyPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Refund and Returns Policy
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="mr-4 bg-primary-100 dark:bg-primary-900 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="font-bold text-gray-900 dark:text-white">
                  We only replace items if they are defective or damaged
                </p>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our refund and returns policy lasts 30 days. If 30 days have passed since your purchase, we can&apos;t offer you an exchange.
              </p>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To be eligible for a return, your item must also be in the original packaging and marked appropriately.
              </p>
              
              <p className="text-gray-700 dark:text-gray-300">
                To complete your return, we require a receipt or proof of purchase.
              </p>
            </div>
            
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 mb-6">
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
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Return Process
              </h2>
              
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
            
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Sale Items
              </h2>
              
              <p className="text-gray-700 dark:text-gray-300">
                Only regular priced items may be refunded. Sale items cannot be refunded.
              </p>
            </div>
            
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Exchange Process
              </h2>
              
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
            
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Shipping Costs
              </h2>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You will be responsible for paying for your own shipping costs to return your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.
              </p>
              
              <p className="text-gray-700 dark:text-gray-300">
                Depending on where you live, the time it may take for your exchanged product to reach you may vary.
              </p>
            </div>
          </div>
          
          <div className="bg-primary-50 dark:bg-gray-700 rounded-lg shadow-md p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Need assistance with a return?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our customer service team is here to help with any questions about returns or exchanges.
            </p>
            <a 
              href="mailto:info@customfiller.com" 
              className="inline-flex items-center px-5 py-2.5 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
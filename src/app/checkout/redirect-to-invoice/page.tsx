'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function RedirectToInvoicePage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const sessionId = searchParams.get('session_id');
  const invoiceUrl = searchParams.get('invoice_url');

  useEffect(() => {
    const handleInvoiceRedirect = async () => {
      try {
        if (invoiceUrl) {
          // Direct invoice URL provided
          console.log('🔗 Redirecting to invoice URL:', invoiceUrl);
          window.location.href = decodeURIComponent(invoiceUrl);
          setStatus('success');
          setMessage('Redirecting to your invoice...');
          return;
        }

        if (sessionId) {
          // Fetch invoice from session
          console.log('🔍 Fetching invoice for session:', sessionId);
          
          const response = await fetch(`/api/stripe/get-invoice?session_id=${sessionId}`);
          const data = await response.json();

          if (response.ok && (data.invoice_url || data.hosted_invoice_url || data.receipt_url)) {
            const redirectUrl = data.invoice_url || data.hosted_invoice_url || data.receipt_url;
            console.log('✅ Redirecting to invoice:', redirectUrl);
            window.location.href = redirectUrl;
            setStatus('success');
            setMessage('Redirecting to your invoice...');
          } else {
            throw new Error(data.error || 'No invoice URL available');
          }
        } else {
          throw new Error('No session ID or invoice URL provided');
        }
      } catch (error) {
        console.error('❌ Error redirecting to invoice:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to redirect to invoice');
      }
    };

    handleInvoiceRedirect();
  }, [sessionId, invoiceUrl]);

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
              {status === 'loading' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 animate-spin rounded-full border-t-2 border-b-2 border-primary-600"></div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Preparing Your Invoice
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please wait while we redirect you to your invoice...
                  </p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Redirecting to Invoice
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {message}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    If you're not redirected automatically, please check your browser's popup blocker.
                  </p>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Invoice Not Available
                  </h1>
                  <p className="text-red-600 dark:text-red-400 mb-6">
                    {message}
                  </p>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      Don't worry! Your payment was successful. You can contact support for your invoice or receipt.
                    </p>
                  </div>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Link
                  href="/checkout/success"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Back to Success Page
                </Link>
                <Link
                  href="/contact-us"
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
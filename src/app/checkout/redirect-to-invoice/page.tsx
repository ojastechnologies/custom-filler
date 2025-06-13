'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function RedirectContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const redirectToInvoice = async () => {
      if (!sessionId) return;

      try {
        const response = await fetch('/api/stripe/get-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();
        
        if (data.invoiceUrl) {
          // Redirect to Stripe invoice
          window.location.href = data.invoiceUrl;
        } else {
          // Fallback to success page
          window.location.href = `/checkout/success?session_id=${sessionId}`;
        }
      } catch (error) {
        console.error('Error redirecting to invoice:', error);
        // Fallback to success page
        window.location.href = `/checkout/success?session_id=${sessionId}`;
      }
    };

    redirectToInvoice();
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Redirecting to your invoice...
        </h2>
        <p className="text-gray-600">
          Please wait while we prepare your receipt.
        </p>
      </div>
    </div>
  );
}

export default function RedirectToInvoicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RedirectContent />
    </Suspense>
  );
}
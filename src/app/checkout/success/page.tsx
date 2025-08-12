'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { sendOrderConfirmationEmail, EmailParams } from '@/services/emailService';

interface InvoiceData {
  invoice_url?: string;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
}

interface OrderDetails {
  customer_name: string;
  customer_email: string;
  order_date: string;
  order_items: { name: string; quantity: number; price: number }[];
  total_amount: number;
  shipping_address: string;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; error?: string } | null>(null);
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const orderNumber = searchParams.get('order_number');
  const sessionAddress = searchParams.get('session_address');

  useEffect(() => {
    console.log('✅ Checkout successful!');
    console.log('Session ID:', sessionId);
    console.log('Order ID:', orderId);
    console.log('Order Number:', orderNumber);

const fetchOrderDetailsAndSendEmail = async () => {
  if (!sessionId || !orderNumber) return;

  try {
    // Fetch order details
    const response = await fetch(`/api/stripe/get-order-details?session_id=${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch order details');
    const orderDetails: OrderDetails = await response.json();

    // Fetch invoice to get PDF link
    const invoiceResponse = await fetch(`/api/stripe/get-invoice?session_id=${sessionId}`);
    if (!invoiceResponse.ok) throw new Error('Failed to fetch invoice');
    const invoiceData: InvoiceData = await invoiceResponse.json();
    console.log('Invoice data:', invoiceData); // Log to inspect
    const pdfLink = invoiceData.invoice_pdf || invoiceData.invoice_url || invoiceData.hosted_invoice_url || 'N/A';
    console.log('PDF Link:', pdfLink); // Log to verify

    if (pdfLink === 'N/A') {
      console.warn('No valid PDF link found in invoice data');
    }

    const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'aerosol@comcast.net';
    const orderItemsFormatted = orderDetails.order_items
      .map(item => `${item.name} (Qty: ${item.quantity}, Price: $${item.price.toFixed(2)})`)
      .join(', ');
    const emailParams: EmailParams = {
      to_email: contactEmail,
      order_number: orderNumber,
      session_id: sessionId,
      reply_to: contactEmail,
      customer_name: orderDetails.customer_name,
      order_date: orderDetails.order_date,
      order_items: orderItemsFormatted,
      total_amount: orderDetails.total_amount.toFixed(2),
      pdf_link: pdfLink,
    };

    console.log('Email params:', emailParams);
    const result = await sendOrderConfirmationEmail(emailParams);
    setEmailStatus(result);
    if (!result.success) {
      console.error('❌ Email sending failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error fetching order details, invoice, or sending email:', error);
  } finally {
    localStorage.removeItem('cart');
    localStorage.removeItem('appliedDeal');
    setLoading(false);
  }
};

    fetchOrderDetailsAndSendEmail();
  }, [sessionId, orderId, orderNumber]);

  // Function to fetch invoice from Stripe (unchanged)
  const fetchInvoice = async () => {
    if (!sessionId) {
      setInvoiceError('No session ID available');
      return;
    }

    setInvoiceLoading(true);
    setInvoiceError(null);

    try {
      console.log('🧾 Fetching invoice for session:', sessionId);
      
      const response = await fetch(`/api/stripe/get-invoice?session_id=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Receipt');
      }

      const data = await response.json();
      console.log('✅ Receipt data received:', data);
      
      setInvoiceData(data);
      
      if (data.invoice_url || data.hosted_invoice_url) {
        const invoiceUrl = data.invoice_url || data.hosted_invoice_url;
        window.open(invoiceUrl, '_blank');
      }
      
    } catch (error) {
      console.error('❌ Error fetching Receipt:', error);
      setInvoiceError(error instanceof Error ? error.message : 'Failed to fetch Receipt');
    } finally {
      setInvoiceLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Payment Successful!
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Thank you for your order. We&apos;ve received your payment and will process your order shortly.
                {emailStatus && emailStatus.success && (
                  <span> A confirmation email has been sent to {process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'aerosol@comcast.net'}.</span>
                )}
                {emailStatus && !emailStatus.success && (
                  <span className="text-red-600"> Failed to send confirmation email: {emailStatus.error}</span>
                )}
              </p>
              
              {orderId && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Order Number:</p>
                  <p className="font-mono text-lg text-gray-900 dark:text-white">{orderNumber}</p>
                </div>
              )}

              {sessionId && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Session ID:</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white break-all">{sessionId}</p>
                </div>
              )}

              {/* Invoice Section (unchanged) */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📄 Receipt
                </h3>
                
                {invoiceError && (
                  <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
                    {invoiceError}
                  </div>
                )}

                {invoiceData && (
                  <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                    <p className="text-green-700 dark:text-green-300 text-sm mb-2">
                      ✅ Invoice ready for download
                    </p>
                    {(invoiceData.invoice_url || invoiceData.hosted_invoice_url) && (
                      <a
                        href={invoiceData.invoice_url || invoiceData.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Invoice
                      </a>
                    )}
                  </div>
                )}

                <button
                  onClick={fetchInvoice}
                  disabled={invoiceLoading || !sessionId}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {invoiceLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Getting Receipt...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Get Receipt
                    </span>
                  )}
                </button>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Your Receipt will open in a new tab and can be downloaded as PDF
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Continue Shopping
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
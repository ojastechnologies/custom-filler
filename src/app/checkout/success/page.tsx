'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';

interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  subtotal?: number;
  discount_amount?: number;
  deal_code?: string;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  order_items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartCleared, setCartCleared] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  const fetchOrderById = useCallback(async (orderId: string) => {
    try {
      console.log('🔍 Fetching order by ID:', orderId);
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('❌ Error fetching order:', orderError);
        throw orderError;
      }

      console.log('✅ Order found:', orderData);
      return orderData;
    } catch (fetchError) {
      console.error('❌ Error fetching order details:', fetchError);
      throw fetchError;
    }
  }, []);

  const fetchOrderBySessionId = useCallback(async (sessionId: string) => {
    try {
      console.log('🔍 Fetching order by session ID:', sessionId);
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('stripe_session_id', sessionId)
        .single();

      if (orderError) {
        console.error('❌ Error fetching order by session:', orderError);
        throw orderError;
      }

      console.log('✅ Order found by session:', orderData);
      return orderData;
    } catch (fetchError) {
      console.error('❌ Error fetching order by session:', fetchError);
      throw fetchError;
    }
  }, []);

  // Get Stripe Invoice URL
  const getStripeInvoiceUrl = useCallback(async (sessionId: string) => {
    try {
      setLoadingInvoice(true);
      console.log('📄 Fetching Stripe invoice URL for session:', sessionId);

      const response = await fetch('/api/stripe/get-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice URL');
      }

      const data = await response.json();
      console.log('✅ Invoice URL received:', data.invoiceUrl);
      
      setInvoiceUrl(data.invoiceUrl);
      return data.invoiceUrl;
    } catch (error) {
      console.error('❌ Error fetching invoice URL:', error);
      return null;
    } finally {
      setLoadingInvoice(false);
    }
  }, []);

  // Redirect to Stripe Invoice
  const viewStripeInvoice = useCallback(() => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    } else if (order?.stripe_session_id) {
      getStripeInvoiceUrl(order.stripe_session_id).then((url) => {
        if (url) {
          window.open(url, '_blank');
        }
      });
    }
  }, [invoiceUrl, order, getStripeInvoiceUrl]);

  useEffect(() => {
    let isMounted = true;

    const handleSuccess = async () => {
      if (!sessionId && !orderId) {
        if (isMounted) {
          setError('No session ID or order ID found in URL');
          setLoading(false);
        }
        return;
      }

      try {
        // Clear cart immediately but only once
        if (!cartCleared) {
          clearCart();
          setCartCleared(true);
          console.log('🛒 Cart cleared');
        }

        let orderData = null;

        // Try to fetch by order ID first (more reliable)
        if (orderId) {
          try {
            orderData = await fetchOrderById(orderId);
          } catch (error) {
            console.log('⚠️ Could not fetch by order ID, trying session ID...', error);
          }
        }

        // If no order found by ID, try session ID
        if (!orderData && sessionId) {
          try {
            orderData = await fetchOrderBySessionId(sessionId);
          } catch (error) {
            console.log('⚠️ Could not fetch by session ID either', error);
          }
        }

        if (isMounted) {
          if (orderData) {
            setOrder(orderData);
            
            // Automatically fetch invoice URL if we have session ID
            if (orderData.stripe_session_id || sessionId) {
              const stripeSessionId = orderData.stripe_session_id || sessionId;
              getStripeInvoiceUrl(stripeSessionId);
            }
          } else {
            setError('Order not found. Please contact support if you completed payment.');
          }
          setLoading(false);
        }

      } catch (err) {
        console.error('❌ Error in success handler:', err);
        if (isMounted) {
          setError('Something went wrong loading your order details');
          setLoading(false);
        }
      }
    };

    handleSuccess();

    return () => {
      isMounted = false;
    };
  }, [sessionId, orderId, clearCart, cartCleared, fetchOrderById, fetchOrderBySessionId, getStripeInvoiceUrl]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Loading Your Order...
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Please wait while we load your order details.
                </p>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Order Not Found
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {error}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="primary"
                    onClick={() => window.location.reload()}
                  >
                    Refresh Page
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </Card>
            </div>
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
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Payment Successful!
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                Thank you for your order. We've received your payment and will process your order shortly.
              </p>

              {/* Order Summary */}
              {order && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 text-left shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Order #{order.order_number}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${order.total_amount.toFixed(2)}
                      </p>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Email:</strong> {order.customer_email}
                    </p>
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Items ({order.order_items.length}):
                        </p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {order.order_items.map((item, index) => (
                            <li key={index} className="flex justify-between">
                              <span>{item.product_name} × {item.quantity}</span>
                              <span>${item.total_price.toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* View Stripe Invoice Button */}
                <Button
                  variant="primary"
                  onClick={viewStripeInvoice}
                  disabled={loadingInvoice}
                  className="flex items-center justify-center"
                >
                  {loadingInvoice ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Loading Invoice...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Invoice
                    </>
                  )}
                </Button>

                {/* Print Button */}
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Invoice
                </Button>

                {/* Continue Shopping */}
                <Button
                  variant="outline"
                  onClick={() => router.push('/services')}
                  className="flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8" />
                  </svg>
                  Continue Shopping
                </Button>

                {/* Dashboard */}
                <Button
                  variant="secondary"
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Go to Dashboard
                </Button>
              </div>

              {/* Auto-redirect option */}
              {invoiceUrl && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    Your invoice is ready! Click the button above to view it, or we can redirect you automatically.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTimeout(() => {
                        window.open(invoiceUrl, '_blank');
                      }, 1000);
                    }}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    Auto-redirect to Invoice in 1 second
                  </Button>
                </div>
              )}

              {/* Email notification */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">
                    A receipt has been sent to {order?.customer_email}
                  </span>
                </div>
              </div>

              {/* Debug Info (Development Only) */}
              {process.env.NODE_ENV === 'development' && order && (
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-left">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Debug Info (Development Only):
                  </h4>
                  <pre className="text-xs text-blue-700 dark:text-blue-300 overflow-auto">
                    {JSON.stringify({ 
                      sessionId, 
                      orderId, 
                      orderStatus: order.status,
                      orderNumber: order.order_number,
                      stripeSessionId: order.stripe_session_id,
                      invoiceUrl: invoiceUrl ? 'Available' : 'Not loaded'
                    }, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Footer />

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-content,
          .invoice-content * {
            visibility: visible;
          }
          .invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .invoice-content .dark\\:bg-gray-800 {
            background: white !important;
          }
          .invoice-content .dark\\:text-white,
          .invoice-content .dark\\:text-gray-300,
          .invoice-content .dark\\:text-gray-400 {
            color: black !important;
          }
          .invoice-content .dark\\:border-gray-700,
          .invoice-content .dark\\:border-gray-800 {
            border-color: #e5e7eb !important;
          }
        }
      `}</style>
    </>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

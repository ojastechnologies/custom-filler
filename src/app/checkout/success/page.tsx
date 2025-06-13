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
            console.log('⚠️ Could not fetch by order ID, trying session ID...',error);
          }
        }

        // If no order found by ID, try session ID
        if (!orderData && sessionId) {
          try {
            orderData = await fetchOrderBySessionId(sessionId);
          } catch (error) {
            console.log('⚠️ Could not fetch by session ID either',error);
          }
        }

        if (isMounted) {
          if (orderData) {
            setOrder(orderData);
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
  }, [sessionId, orderId, clearCart, cartCleared, fetchOrderById, fetchOrderBySessionId]);

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
                {sessionId && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    Session ID: {sessionId}
                  </p>
                )}
                {orderId && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Order ID: {orderId}
                  </p>
                )}
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
                Thank you for your order. We&apos;ve received your payment and will process your order shortly.
              </p>

              {order && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6 text-left">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Order Details
                  </h2>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Order Number:</span>
                                           <span className="font-medium text-gray-900 dark:text-white">{order.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Email:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{order.customer_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total:</span>
                      <span className="font-medium text-gray-900 dark:text-white">${order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'processing' 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : order.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {order.order_items && order.order_items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Items Ordered:</h3>
                      <div className="space-y-1">
                        {order.order_items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {item.product_name} × {item.quantity}
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              ${item.total_price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    What happens next?
                  </h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• You&apos;ll receive an order confirmation email shortly</li>
                    <li>• We&apos;ll process and prepare your order</li>
                    <li>• You&apos;ll get shipping updates via email</li>
                    <li>• Track your order in the customer dashboard</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="primary"
                    onClick={() => router.push('/dashboard')}
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/services')}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Loading...
                </h1>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </>
    }>
      <SuccessContent />
    </Suspense>
  );
}

'use client';

import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

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

  // PDF Download Function
  const downloadInvoicePDF = useCallback(async () => {
    if (!order || !invoiceRef.current) return;

    try {
      setIsGeneratingPDF(true);
      console.log('📄 Generating PDF invoice...');

      // Create a clone of the invoice element for PDF generation
      const invoiceElement = invoiceRef.current;
      const clonedElement = invoiceElement.cloneNode(true) as HTMLElement;
      
      // Style the cloned element for better PDF appearance
      clonedElement.style.width = '800px';
      clonedElement.style.padding = '40px';
      clonedElement.style.backgroundColor = 'white';
      clonedElement.style.color = 'black';
      clonedElement.style.fontFamily = 'Arial, sans-serif';
      
      // Temporarily add to DOM for rendering
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '-9999px';
      clonedElement.style.top = '0';
      document.body.appendChild(clonedElement);

      // Generate canvas from the cloned element
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: clonedElement.scrollHeight
      });

      // Remove cloned element
      document.body.removeChild(clonedElement);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // 10mm top margin

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20; // Account for margins

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      // Download the PDF
      const fileName = `invoice-${order.order_number}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      console.log('✅ PDF generated and downloaded:', fileName);
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [order]);

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
                Thank you for your order. We've received your payment and will process your order shortly.
              </p>

              {/* Invoice Section - This will be captured for PDF */}
              {order && (
                <div ref={invoiceRef} className="invoice-content">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-6 text-left shadow-lg">
                    {/* Invoice Header */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            INVOICE
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400">
                            Custom Filler Services
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Professional Aerosol Filling Solutions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            #{order.order_number}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Bill To:
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {order.customer_email}
                      </p>
                    </div>

                    {/* Order Items */}
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Order Items:
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                  Item
                                </th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                  Qty
                                </th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                  Unit Price
                                </th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                  Total
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.order_items.map((item, index) => (
                                <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                    {item.product_name}
                                  </td>
                                  <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                                    {item.quantity}
                                  </td>
                                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                                    ${item.unit_price.toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                                    ${item.total_price.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Order Summary */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <div className="space-y-3">
                        {order.subtotal && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              ${order.subtotal.toFixed(2)}
                            </span>
                          </div>
                        )}
                        
                        {order.discount_amount && order.discount_amount > 0 && (
                          <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span>
                              Discount {order.deal_code ? `(${order.deal_code})` : ''}:
                            </span>
                            <span>-${order.discount_amount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-3">
                          <span>Total Paid:</span>
                          <span>${order.total_amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-800 dark:text-green-200 font-medium">
                          Payment Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Thank you for choosing Custom Filler Services
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        For questions about your order, please contact our support team.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                {/* PDF Download Button */}
                <Button
                  variant="primary"
                  onClick={downloadInvoicePDF}
                  disabled={isGeneratingPDF || !order}
                  className="flex items-center justify-center"
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Invoice PDF
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
                      orderNumber: order.order_number 
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

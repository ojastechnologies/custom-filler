'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import { useCart } from '@/context/CartContext';

interface CardHeaderProps {
  children: React.ReactNode;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardDescriptionProps {
  children: React.ReactNode;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary';
}

// Simple implementations of missing UI components with blue theme
const CardHeader: React.FC<CardHeaderProps> = ({ children }) => (
  <div className="p-6 pb-0">{children}</div>
);

const CardTitle: React.FC<CardTitleProps> = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

const CardDescription: React.FC<CardDescriptionProps> = ({ children }) => (
  <p className="text-sm text-gray-600">{children}</p>
);

const CardContent: React.FC<CardContentProps> = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
    variant === 'default' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-gray-100 text-gray-800'
  }`}>
    {children}
  </span>
);

// Simple SVG icon components with blue theme
const CheckCircle: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Package: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const Mail: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const Phone: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MapPin: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CreditCard: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    <line x1="1" y1="10" x2="23" y2="10" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
  </svg>
);

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount?: number;
  currency: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  shipping_line1: string;
  shipping_line2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  created_at: string;
  items: Array<{
    id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    total_price: number;
    product_image?: string;
    product_id?: string;
  }>;
  deal_code?: string;
}

interface StripeSessionData {
  customerInfo: {
    email: string;
    name: string;
    phone: string;
    address: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    } | null;
  };
  paymentInfo: {
    payment_status: string;
    amount_total: number;
    currency: string;
    payment_intent_id: string;
  };
  lineItems: Array<{
    product_name: string;
    quantity: number;
    amount_total: number;
  }>;
}

// Helper function to safely format currency values
const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00';
  }
  return Number(value).toFixed(2);
};

// LocalStorage utility functions for email tracking
const getEmailSentKey = (orderIdentifier: string) => `emails_sent_${orderIdentifier}`;

const isEmailAlreadySent = (orderIdentifier: string): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(getEmailSentKey(orderIdentifier)) === 'true';
};

const markEmailAsSent = (orderIdentifier: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getEmailSentKey(orderIdentifier), 'true');
  // Also store timestamp for audit purposes
  localStorage.setItem(`${getEmailSentKey(orderIdentifier)}_timestamp`, new Date().toISOString());
};

export default function CheckoutSuccessPage() {
  const googleTagId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
  const conversionEvent1 = process.env.NEXT_PUBLIC_GOOGLE_CONVERSION_EVENT_1;
  const conversionEvent2 = process.env.NEXT_PUBLIC_GOOGLE_CONVERSION_EVENT_2;
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const orderNumber = searchParams.get('order_number');

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [stripeData, setStripeData] = useState<StripeSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [cartCleared, setCartCleared] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    sending: boolean;
    sent: boolean;
    error: string | null;
    details?: {
      totalSucceeded: number;
      totalAttempted: number;
    };
  }>({
    sending: false,
    sent: false,
    error: null,
  });

  // Get cart context for clearing cart
  const { clearCart } = useCart();

  // Function to send order confirmation emails (only once using localStorage)
  const sendOrderEmailsOnce = async (order: OrderDetails) => {
    // Use order ID or order number as unique identifier
    const orderIdentifier = order.id || order.order_number;
    
    // Check if emails were already sent using localStorage
    if (isEmailAlreadySent(orderIdentifier)) {
      console.log('✅ Emails already sent for this order (localStorage check)');
      setEmailStatus({ sending: false, sent: true, error: null });
      return;
    }

    // Check if already sending emails to prevent duplicate calls
    if (emailStatus.sending) {
      console.log('⚠️ Email sending already in progress, skipping duplicate call');
      return;
    }

    setEmailStatus({ sending: true, sent: false, error: null });
    
    try {
      const orderData = {
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        orderItems: order.items.map(item => {
          // Calculate unit price dynamically if not available or if it's zero but total is available
          let calculatedPrice = item.unit_price || 0;
          if ((calculatedPrice === 0 || !calculatedPrice) && item.total_price && item.quantity && item.quantity > 0) {
            calculatedPrice = item.total_price / item.quantity;
          }
          
          // Use product name or a default value
          let productName = item.product_name || 'Laser Cryogen';
          if (!productName || productName.trim() === '') {
            productName = 'Laser Cryogen'; // Use Laser Cryogen as fallback
          }
          
          return {
            name: productName,
            quantity: item.quantity || 1,
            price: calculatedPrice,
            total: item.total_price || 0,
          };
        }),
        subtotal: order.subtotal || 0,
        discountAmount: order.discount_amount || 0,
        shippingCost: order.shipping_cost || 0,
        taxAmount: order.tax_amount || 0,
        totalAmount: order.total_amount || 0,
        currency: order.currency || 'USD',
        paymentStatus: 'paid',
        orderDate: order.created_at || new Date().toISOString(),
        shippingAddress: {
          line1: order.shipping_line1 || '',
          line2: order.shipping_line2,
          city: order.shipping_city || '',
          state: order.shipping_state || '',
          postalCode: order.shipping_postal_code || '',
          country: order.shipping_country || '',
        },
        dealCode: order.deal_code,
      };

      // Validate that the order items have proper data for debugging
      console.log('📧 Order data validation:', {
        orderNumber: orderData.orderNumber,
        customerEmail: orderData.customerEmail,
        itemValidation: orderData.orderItems.map((item, idx) => ({
          index: idx,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        }))
      });

      console.log('📧 Sending order confirmation emails...', {
        orderNumber: orderData.orderNumber,
        customerEmail: orderData.customerEmail,
        itemCount: orderData.orderItems.length
      });

      const response = await fetch('/api/emails/send-order-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderData,
          sendToAdmin: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Email API response not OK:', response.status, errorText);
        throw new Error(`Email API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      console.log('📧 Email API response:', result);

      if (result.success) {
        // Mark emails as sent in localStorage
        markEmailAsSent(orderIdentifier);
        
        setEmailStatus({ 
          sending: false, 
          sent: true, 
          error: null,
          details: result.details
        });
        console.log('✅ Order confirmation emails sent successfully:', result.message);
      } else {
        const errorMessage = Array.isArray(result.errors) && result.errors.length > 0
          ? result.errors.join('; ')
          : result.error || result.message || 'Failed to send emails';
          
        setEmailStatus({ 
          sending: false, 
          sent: false, 
          error: errorMessage,
          details: result.details
        });
        console.error('❌ Some emails failed to send:', {
          errors: result.errors,
          message: result.message,
          details: result.details
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send emails';
      console.error('❌ Error sending order emails:', error);
      setEmailStatus({ 
        sending: false, 
        sent: false, 
        error: errorMessage
      });
    }
  };

  useEffect(() => {
    // Prevent repeated API calls by checking if data is already fetched
    if (dataFetched) {
      console.log('✅ Data already fetched, skipping API call');
      return;
    }

    // Check if we have the minimum required parameters
    if (!sessionId && !orderId) {
      setError('No order information found');
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      // Prevent duplicate execution by checking if already processing
      if (dataFetched) {
        console.log('⚠️ Data already fetched, skipping duplicate API call');
        return;
      }

      try {
        if (!sessionId && !orderId) {
          setError('No order information found');
          setLoading(false);
          return;
        }

        console.log('🔍 Fetching order details (ONCE):', { sessionId, orderId, orderNumber });

        // Check if emails have already been sent for this order
        const orderIdentifier = orderId || (sessionId ? `session_${sessionId}` : null);
        if (orderIdentifier && isEmailAlreadySent(orderIdentifier)) {
          console.log('✅ Emails already sent for this order (early check)');
          setEmailStatus({ sending: false, sent: true, error: null });
          setDataFetched(true);
          setLoading(false);
          return;
        }

        let orderProcessed = false;

        // If we have a session ID, fetch complete data from Stripe
        if (sessionId && !orderProcessed) {
          const stripeResponse = await fetch(`/api/stripe/session/${sessionId}`);
          
          if (stripeResponse.ok) {
            const stripeResult = await stripeResponse.json();
            console.log('✅ Stripe session data:', stripeResult);
            
            if (stripeResult.success) {
              setStripeData(stripeResult.stripeData);
              
              // If we also have the database order, use that
              if (stripeResult.order) {
                setOrderDetails(stripeResult.order);
                // Send emails after we have the complete order data from DB (only once)
                await sendOrderEmailsOnce(stripeResult.order);
                orderProcessed = true;
              }
            }
          } else {
            console.warn('⚠️ Could not fetch Stripe session data');
          }
        }

        // If we have an order ID but no order processed yet, try to fetch it directly
        if (orderId && !orderProcessed) {
          const orderResponse = await fetch(`/api/orders/${orderId}`);
          
          if (orderResponse.ok) {
            const orderResult = await orderResponse.json();
            console.log('✅ Database order data:', orderResult);
            
            if (orderResult.success && orderResult.order) {
              setOrderDetails(orderResult.order);
              // Send emails after we have the complete order data from DB (only once)
              await sendOrderEmailsOnce(orderResult.order);
              orderProcessed = true;
            }
          } else {
            console.warn('⚠️ Could not fetch order from database');
          }
        }

        // Mark data as fetched to prevent repeated calls
        setDataFetched(true);

      } catch (err) {
        console.error('❌ Error fetching order details:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId, orderId, orderNumber, dataFetched, orderDetails]);

  // Clear cart after successful order confirmation
  useEffect(() => {
    // Only clear cart if:
    // 1. We have order data (either from Stripe or database)
    // 2. Payment was successful
    // 3. Cart hasn't been cleared yet
    // 4. Data has been fetched (to avoid clearing during loading)
    const hasOrderData = orderDetails || stripeData;
    const paymentSuccessful = stripeData?.paymentInfo?.payment_status === 'paid' || 
                             stripeData?.paymentInfo?.payment_status === 'complete' ||
                             orderDetails?.status === 'processing' ||
                             orderDetails?.status === 'shipped' ||
                             orderDetails?.status === 'delivered';

    if (hasOrderData && paymentSuccessful && !cartCleared && dataFetched) {
      console.log('🛒 Clearing cart after successful order confirmation');
      clearCart();
      setCartCleared(true);
      
      // Store in localStorage to prevent cart clearing on page refresh
      localStorage.setItem(`order_${orderId || sessionId}_cart_cleared`, 'true');
    }
  }, [orderDetails, stripeData, cartCleared, dataFetched, clearCart, orderId, sessionId]);

  // Check if cart was already cleared for this order on component mount
  useEffect(() => {
    const orderKey = orderId || sessionId;
    if (orderKey) {
      const alreadyCleared = localStorage.getItem(`order_${orderKey}_cart_cleared`);
      if (alreadyCleared === 'true') {
        setCartCleared(true);
      }
    }
  }, [orderId, sessionId]);

  // Check if emails were already sent on component mount
  useEffect(() => {
    if (orderDetails) {
      const orderIdentifier = orderDetails.id || orderDetails.order_number;
      if (isEmailAlreadySent(orderIdentifier)) {
        setEmailStatus({ sending: false, sent: true, error: null });
      }
    }
  }, [orderDetails]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading your order details...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <p className="text-red-600">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Use database order data as primary source, fallback to Stripe data
  const displayName = orderDetails?.customer_name || stripeData?.customerInfo?.name || 'Valued Customer';
  const displayEmail = orderDetails?.customer_email || stripeData?.customerInfo?.email;
  const displayPhone = orderDetails?.customer_phone || stripeData?.customerInfo?.phone;
  const paymentStatus = stripeData?.paymentInfo?.payment_status || 'completed';

  // Get order total and transaction ID for conversion tracking
  const orderTotal = orderDetails?.total_amount || stripeData?.paymentInfo?.amount_total || 0;
  const transactionId = orderDetails?.order_number || orderId || sessionId || '';

  return (
    <div className="container mx-auto px-4 py-8">
      {googleTagId && conversionEvent1 && (
        <Script id="google-ads-conversion-1" strategy="afterInteractive">
          {`gtag('event', 'conversion', {
            'send_to': '${googleTagId}/${conversionEvent1}',
            'value': ${orderTotal},
            'currency': 'USD',
            'transaction_id': '${transactionId}'
          });`}
        </Script>
      )}
      {googleTagId && conversionEvent2 && (
        <Script id="google-ads-conversion-2" strategy="afterInteractive">
          {`gtag('event', 'conversion', {
            'send_to': '${googleTagId}/${conversionEvent2}',
            'value': ${orderTotal},
            'currency': 'USD',
            'transaction_id': '${transactionId}'
          });`}
        </Script>
      )}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Header */}
        <Card className="border-blue-200">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-blue-600 mx-auto" />
              <div>
                <h1 className="text-3xl font-bold text-blue-700">Payment Successful!</h1>
                <p className="text-lg text-gray-600 mt-2">
                  Thank you for your order, {displayName}
                </p>
                {/* Show cart cleared confirmation */}
                {cartCleared && (
                  <p className="text-sm text-blue-600 mt-1">
                    ✅ Your cart has been cleared
                  </p>
                )}
              </div>
              {orderDetails?.order_number && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600">Order Number</p>
                  <p className="text-xl font-mono font-bold text-blue-800">{orderDetails.order_number}</p>
                </div>
              )}

              {/* Email Status */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                {emailStatus.sending && (
                  <p className="text-blue-600 flex items-center justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></span>
                    Sending order confirmation emails...
                  </p>
                )}
                {emailStatus.sent && (
                  <div className="text-green-600">
                    <p className="flex items-center justify-center">
                      <span className="mr-2">✅</span>
                      Order confirmation emails sent successfully!
                    </p>
                    {emailStatus.details && (
                      <p className="text-sm mt-1">
                        {emailStatus.details.totalSucceeded} of {emailStatus.details.totalAttempted} emails sent
                      </p>
                    )}
                  </div>
                )}
                {emailStatus.error && (
                  <div className="text-red-600">
                    <p className="flex items-center justify-center">
                      <span className="mr-2">❌</span>
                      Email sending failed
                    </p>
                    <p className="text-sm mt-1">{emailStatus.error}</p>
                    {emailStatus.details && (
                      <p className="text-xs mt-1 text-gray-500">
                        {emailStatus.details.totalSucceeded || 0} of {emailStatus.details.totalAttempted || 0} emails sent
                      </p>
                    )}
                  </div>
                )}
                {!emailStatus.sending && !emailStatus.sent && !emailStatus.error && (
                  <p className="text-gray-600">
                    📧 Order confirmation will be sent to {displayEmail}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Information */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Package className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{displayEmail}</p>
                  </div>
                </div>
              )}
              
              {displayPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{displayPhone}</p>
                  </div>
                </div>
              )}

              {orderDetails && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-blue-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Shipping Address</p>
                    <div className="font-medium">
                      <p>{orderDetails.shipping_line1}</p>
                      {orderDetails.shipping_line2 && <p>{orderDetails.shipping_line2}</p>}
                      <p>
                        {orderDetails.shipping_city}, {orderDetails.shipping_state} {orderDetails.shipping_postal_code}
                      </p>
                      <p>{orderDetails.shipping_country}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <Badge variant={paymentStatus === 'paid' ? 'default' : 'secondary'}>
                  {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                </Badge>
              </div>
              
              {orderDetails && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="font-medium">${formatCurrency(orderDetails.subtotal)}</span>
                  </div>
                  
                  {orderDetails.discount_amount && orderDetails.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Discount {orderDetails.deal_code && `(${orderDetails.deal_code})`}
                      </span>
                      <span className="font-medium text-green-600">-${formatCurrency(orderDetails.discount_amount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Shipping</span>
                    <span className="font-medium">${formatCurrency(orderDetails.shipping_cost)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax</span>
                    <span className="font-medium">${formatCurrency(orderDetails.tax_amount)}</span>
                  </div>
                  
                  <hr className="my-2" />
                  
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-blue-700">${formatCurrency(orderDetails.total_amount)}</span>
                  </div>
                </div>
              )}

              {stripeData?.paymentInfo?.payment_intent_id && (
                <div>
                  <p className="text-sm text-gray-600">Payment ID</p>
                  <p className="font-mono text-sm text-gray-500">{stripeData.paymentInfo.payment_intent_id}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        {orderDetails?.items?.length && (
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-700">Order Items</CardTitle>
              <CardDescription>
                {orderDetails.items.length} item(s) in this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-4 border border-blue-100 rounded-lg bg-blue-50">
                    <div className="flex items-center gap-4 flex-1">
                      {item.product_image && (
                        <Image 
                          src={item.product_image} 
                          alt={item.product_name || 'Laser Cryogen'}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded border border-blue-200"
                        />
                      )}
                      <div>
                        <h3 className="font-medium text-blue-900">{item.product_name || 'Laser Cryogen'}</h3>
                        <p className="text-sm text-blue-600">
                          Quantity: {item.quantity || 1} × ${formatCurrency(item.unit_price || (item.total_price && item.quantity && item.quantity > 0 ? item.total_price / item.quantity : 0))}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-700">
                        ${formatCurrency(item.total_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-700">What&apos;s Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="flex items-center text-blue-600">
                <span className="mr-2">✅</span>
                Payment processed successfully
              </p>
              <p className="flex items-center text-blue-600">
                <span className="mr-2">📦</span>
                Order is being prepared for shipment
              </p>
              <p className="flex items-center text-blue-600">
                <span className="mr-2">📧</span>
                Confirmation emails sent to {displayEmail}
              </p>
              <p className="flex items-center text-blue-600">
                <span className="mr-2">🚚</span>
                You&apos;ll receive tracking information once shipped
              </p>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Need help?</strong> Please check your email (including spam folder) for order details, 
                  or contact our customer service with your order number: <strong>{orderDetails?.order_number}</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';

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

// Simple implementations of missing UI components
const CardHeader: React.FC<CardHeaderProps> = ({ children }) => (
  <div className="p-6 pb-0">{children}</div>
);

const CardTitle: React.FC<CardTitleProps> = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

const CardDescription: React.FC<CardDescriptionProps> = ({ children }) => (
  <p className="text-sm text-muted-foreground">{children}</p>
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

const Separator: React.FC = () => (
  <hr className="border-t border-gray-200 my-4" />
);

// Simple SVG icon components to replace Lucide React icons
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
  currency: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: unknown;
  created_at: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    total_price: number;
  }>;
  deal_code?: string;
  discount_amount?: number;
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

// Type for items that could come from either Stripe or database
interface DisplayItem {
  product_name?: string;
  name?: string;
  quantity: number;
  amount_total?: number;
  total_price?: number;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const orderNumber = searchParams.get('order_number');

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [stripeData, setStripeData] = useState<StripeSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!sessionId && !orderId) {
          setError('No order information found');
          return;
        }

        console.log('🔍 Fetching order details:', { sessionId, orderId, orderNumber });

        // If we have a session ID, fetch complete data from Stripe
        if (sessionId) {
          const stripeResponse = await fetch(`/api/stripe/session/${sessionId}`);
          
          if (stripeResponse.ok) {
            const stripeResult = await stripeResponse.json();
            console.log('✅ Stripe session data:', stripeResult);
            
            if (stripeResult.success) {
              setStripeData(stripeResult.stripeData);
              
              // If we also have the database order, use that
              if (stripeResult.order) {
                setOrderDetails(stripeResult.order);
              }
            }
          } else {
            console.warn('⚠️ Could not fetch Stripe session data');
          }
        }

        // If we have an order ID but no database order yet, try to fetch it directly
        if (orderId && !orderDetails) {
          const orderResponse = await fetch(`/api/orders/${orderId}`);
          
          if (orderResponse.ok) {
            const orderResult = await orderResponse.json();
            console.log('✅ Database order data:', orderResult);
            
            if (orderResult.success) {
              setOrderDetails(orderResult.order);
            }
          } else {
            console.warn('⚠️ Could not fetch order from database');
          }
        }

      } catch (err) {
        console.error('❌ Error fetching order details:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId, orderId, orderNumber, orderDetails]);

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

  // Use Stripe data as primary source, fallback to database order
  const displayName = stripeData?.customerInfo?.name || orderDetails?.customer_name || 'Valued Customer';
  const displayEmail = stripeData?.customerInfo?.email || orderDetails?.customer_email;
  const displayPhone = stripeData?.customerInfo?.phone || orderDetails?.customer_phone;
  const displayAddress = stripeData?.customerInfo?.address;
  const paymentStatus = stripeData?.paymentInfo?.payment_status || 'completed';
  const totalAmount = stripeData?.paymentInfo?.amount_total 
    ? stripeData.paymentInfo.amount_total / 100 
    : orderDetails?.total_amount || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Header */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h1 className="text-3xl font-bold text-green-600">Payment Successful!</h1>
                <p className="text-lg text-gray-600 mt-2">
                  Thank you for your order, {displayName}
                </p>
              </div>
              
              {orderNumber && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="text-xl font-mono font-bold">{orderNumber}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{displayEmail}</p>
                  </div>
                </div>
              )}
              
              {displayPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{displayPhone}</p>
                  </div>
                </div>
              )}

              {displayAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Shipping Address</p>
                    <div className="font-medium">
                      <p>{displayAddress.line1}</p>
                      {displayAddress.line2 && <p>{displayAddress.line2}</p>}
                      <p>
                        {displayAddress.city}, {displayAddress.state} {displayAddress.postal_code}
                      </p>
                      <p>{displayAddress.country}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
              
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
              </div>

              {stripeData?.paymentInfo?.payment_intent_id && (
                <div>
                  <p className="text-sm text-gray-600">Payment ID</p>
                  <p className="font-mono text-sm">{stripeData.paymentInfo.payment_intent_id}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        {(stripeData?.lineItems?.length || orderDetails?.items?.length) && (
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                {stripeData?.lineItems?.length || orderDetails?.items?.length} item(s) in this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(stripeData?.lineItems || orderDetails?.items || []).map((item: DisplayItem, index: number) => (
                  <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {item.product_name || item.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${((item.amount_total || item.total_price || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>What&apos;s Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>✅ Order confirmation has been sent to {displayEmail}</p>
              <p>📦 We&apos;ll send you tracking information once your order ships</p>
              <p>💬 Questions? Contact our support team</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

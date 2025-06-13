'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { fetchOrders, updateOrderStatus, Order } from '@/services/ordersService';

export default function OrdersPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/enter-portal-9f3b2');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadOrders();
    }
  }, [user, loading, isAdmin]);

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      setError(null);
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingStatus(orderId);
      await updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <Card className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You need administrator privileges to view orders.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </Card>
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
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Order Management
              </h1>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>

            {error && (
              <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-md mb-6">
                <p className="font-medium">Error</p>
                <p>{error}</p>
                <button 
                  onClick={() => setError(null)} 
                  className="text-sm underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            )}

            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  All Orders ({orders.length})
                </h2>
                <Button
                  variant="outline"
                  onClick={loadOrders}
                  disabled={loadingOrders}
                >
                  {loadingOrders ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>

              {loadingOrders ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No orders found.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 mb-4 lg:mb-0">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Order #{order.order_number}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 mt-2 lg:mt-0">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4">
                          <div className="text-right mb-2 lg:mb-0">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              ${order.total_amount.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {order.currency.toUpperCase()}
                            </p>
                          </div>
                          
                          {/* Status Update Dropdown */}
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                            disabled={updatingStatus === order.id}
                            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Customer Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Customer</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer_email}</p>
                          {order.customer_name && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer_name}</p>
                          )}
                          {order.customer_phone && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer_phone}</p>
                          )}
                        </div>
                        
                        {(order.shipping_line1 || order.shipping_city) && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Shipping Address</h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {order.shipping_line1 && <p>{order.shipping_line1}</p>}
                              {order.shipping_line2 && <p>{order.shipping_line2}</p>}
                              {order.shipping_city && (
                                <p>
                                  {order.shipping_city}
                                  {order.shipping_state && `, ${order.shipping_state}`}
                                  {order.shipping_postal_code && ` ${order.shipping_postal_code}`}
                                </p>
                              )}
                              {order.shipping_country && <p>{order.shipping_country}</p>}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Order Items */}
                      {order.order_items && order.order_items.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Order Items</h4>
                          <div className="space-y-3">
                            {order.order_items.map((item, index) => (
                              <div key={item.id || index} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="relative w-16 h-16 flex-shrink-0">
                                  {item.product_image && (
                                    <Image
                                      src={item.product_image}
                                      alt={item.product_name}
                                      fill
                                      className="object-cover rounded"
                                      sizes="64px"
                                    />
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {item.product_name}
                                  </h5>
                                  {item.product_description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                      {item.product_description}
                                    </p>
                                  )}
                                  {item.product_clientpathurl && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                      Service: {item.product_clientpathurl}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    ${item.unit_price.toFixed(2)} × {item.quantity}
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    ${item.total_price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Order Totals */}
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <div className="flex justify-end">
                          <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                              <span className="text-gray-900 dark:text-white">${order.subtotal.toFixed(2)}</span>
                            </div>
                            {order.shipping_cost > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                                <span className="text-gray-900 dark:text-white">${order.shipping_cost.toFixed(2)}</span>
                              </div>
                            )}
                            {order.tax_amount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                                <span className="text-gray-900 dark:text-white">${order.tax_amount.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-base font-semibold border-t border-gray-200 dark:border-gray-600 pt-2">
                              <span className="text-gray-900 dark:text-white">Total:</span>
                              <span className="text-gray-900 dark:text-white">${order.total_amount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Information */}
                      {(order.stripe_session_id || order.stripe_payment_intent_id) && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Payment Information</h4>
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            {order.stripe_session_id && (
                              <p>Session ID: {order.stripe_session_id}</p>
                            )}
                            {order.stripe_payment_intent_id && (
                              <p>Payment Intent: {order.stripe_payment_intent_id}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

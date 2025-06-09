'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { fetchOrders, updateOrderStatus, getOrderStats, Order, OrderStats } from '@/services/ordersService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Image from 'next/image';

export default function OrdersPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, loading, isAdmin, router]);

  const loadOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      setError(null);
      
      const [ordersData, statsData] = await Promise.all([
        fetchOrders(),
        getOrderStats()
      ]);
      
      setOrders(ordersData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadOrders();
    }
  }, [user, loading, isAdmin, loadOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingStatus(orderId);
      const updatedOrder = await updateOrderStatus(orderId, newStatus);
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? updatedOrder : order
        )
      );
      
      // Refresh stats
      const newStats = await getOrderStats();
      setStats(newStats);
      
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading || loadingOrders) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 flex justify-center items-center min-h-[50vh]">
            <LoadingSpinner />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user || !isAdmin) {
    return null;
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

            {/* Order Statistics */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_orders}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.total_revenue.toFixed(2)}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Orders</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending_orders}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Shipped Orders</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.shipped_orders}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                <p className="font-medium">Error</p>
                <p>{error}</p>
                <button 
                  onClick={() => setError(null)} 
                  className="text-sm underline mt-2"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Orders Table */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No orders</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No orders have been placed yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            #{order.id.slice(0, 8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {order.customer_name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {order.customer_email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            ${order.total_amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                              >
                                View
                              </button>
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                                disabled={updatingStatus === order.id}
                                className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Order Detail Modal */}
            {selectedOrder && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Order Details - #{selectedOrder.id.slice(0, 8)}
                      </h3>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Customer Information */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Customer Information</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Name:</span> {selectedOrder.customer_name || 'N/A'}</p>
                          <p><span className="font-medium">Email:</span> {selectedOrder.customer_email}</p>
                          <p><span className="font-medium">Phone:</span> {selectedOrder.customer_phone || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Shipping Address</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedOrder.shipping_line1 ? (
                            <>
                              <p>{selectedOrder.shipping_line1}</p>
                              {selectedOrder.shipping_line2 && <p>{selectedOrder.shipping_line2}</p>}
                              <p>
                                {selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_postal_code}
                              </p>
                              <p>{selectedOrder.shipping_country}</p>
                            </>
                          ) : (
                            <p>No shipping address provided</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Order Items</h4>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Quantity</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Price</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {selectedOrder.order_items?.map((item) => (
                              <tr key={item.id}>
                                <td className="px-4 py-2">
                                  <div className="flex items-center">
                                    {item.product_image && (
                                        <Image
                                          src={item.product_image}
                                          alt={item.product_name}
                                          fill
                                          className="object-cover rounded"
                                          sizes="40px"
                                        />
                                    )}
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                                      {item.product_description && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.product_description}</p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">${item.unit_price.toFixed(2)}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">${item.total_price.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex justify-end">
                        <div className="w-64">
                          <div className="flex justify-between py-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
                            <span className="text-sm text-gray-900 dark:text-white">${selectedOrder.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Shipping:</span>
                            <span className="text-sm text-gray-900 dark:text-white">${selectedOrder.shipping_cost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Tax:</span>
                            <span className="text-sm text-gray-900 dark:text-white">${selectedOrder.tax_amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-base font-medium text-gray-900 dark:text-white">Total:</span>
                            <span className="text-base font-bold text-gray-900 dark:text-white">${selectedOrder.total_amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Status and Dates */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Status:</span>
                          <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                            {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Order Date:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {new Date(selectedOrder.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {selectedOrder.shipped_at && (
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">Shipped Date:</span>
                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                              {new Date(selectedOrder.shipped_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

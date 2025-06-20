'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { fetchOrders, updateOrderStatus, Order } from '@/services/ordersService';
import React from 'react';

export default function OrdersPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

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
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
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

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getOrderStats = () => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);

    return { total, pending, processing, shipped, delivered, cancelled, totalRevenue };
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900 min-h-screen">
          <div className="w-full px-6 flex justify-center items-center min-h-[50vh]">
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
        <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900 min-h-screen">
          <div className="w-full px-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You need administrator privileges to view orders.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const stats = getOrderStats();

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Full Width Header Section */}
        <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="w-full px-6 py-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Order Management
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Monitor and manage all customer orders
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={loadOrders}
                  disabled={loadingOrders}
                  className="flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{loadingOrders ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to Dashboard</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="w-full px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Processing</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.processing}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Shipped</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.shipped}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Delivered</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.delivered}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Cancelled</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.cancelled}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Revenue</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">${stats.totalRevenue.toFixed(0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="w-full px-6 mb-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="font-medium">Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)} 
                  className="ml-4 text-red-400 hover:text-red-600 dark:text-red-300 dark:hover:text-red-100"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="w-full px-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    All Orders ({orders.length})
                  </h2>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Click on any order to view details
                </div>
              </div>
            </div>

            {loadingOrders ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders found</h3>
                <p className="text-gray-500 dark:text-gray-400">Orders will appear here once customers start placing them</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Updated
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {orders.map((order) => (
                      <React.Fragment key={order.id}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <button
                                onClick={() => toggleOrderExpansion(order.id)}
                                className="mr-3 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                              >
                                <svg 
                                  className={`w-4 h-4 text-gray-400 transition-transform ${expandedOrder === order.id ? 'rotate-90' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                              <div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                  #{order.order_number}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900 dark:text-white truncate max-w-xs" title={order.customer_email}>
                                {order.customer_email}
                              </div>
                              {order.customer_name && (
                                <div className="text-gray-500 dark:text-gray-400 truncate max-w-xs" title={order.customer_name}>
                                  {order.customer_name}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                {order.order_items?.length || 0} items
                              </span>
                              {order.order_items && order.order_items.length > 0 && (
                                <div className="flex -space-x-1">
                                  {order.order_items.slice(0, 3).map((item, index) => (
                                    <div key={item.id || index} className="relative w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden">
                                      {item.product_image ? (
                                        <Image
                                          src={item.product_image}
                                          alt={item.product_name}
                                          fill
                                          className="object-cover"
                                          sizes="24px"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {item.product_name.charAt(0)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {order.order_items.length > 3 && (
                                    <div className="relative w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        +{order.order_items.length - 3}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="font-bold text-gray-900 dark:text-white">
                                ${order.total_amount.toFixed(2)}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400 uppercase text-xs">
                                {order.currency}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                                                            {order.stripe_payment_intent_id ? (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  Pending
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {formatShortDate(order.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {formatShortDate(order.updated_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                                disabled={updatingStatus === order.id}
                                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              {updatingStatus === order.id && (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-600"></div>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Order Details */}
                        {expandedOrder === order.id && (
                          <tr>
                            <td colSpan={9} className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30">
                              <div className="space-y-6">
                                {/* Customer & Shipping Information */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      Customer Information
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                                        <span className="ml-2 text-gray-900 dark:text-white">{order.customer_email}</span>
                                      </div>
                                      {order.customer_name && (
                                        <div>
                                          <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                                          <span className="ml-2 text-gray-900 dark:text-white">{order.customer_name}</span>
                                        </div>
                                      )}
                                      {order.customer_phone && (
                                        <div>
                                          <span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span>
                                          <span className="ml-2 text-gray-900 dark:text-white">{order.customer_phone}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {(order.shipping_line1 || order.shipping_city) && (
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Shipping Address
                                      </h4>
                                      <div className="text-sm text-gray-900 dark:text-white space-y-1">
                                        {order.shipping_line1 && <div>{order.shipping_line1}</div>}
                                        {order.shipping_line2 && <div>{order.shipping_line2}</div>}
                                        {order.shipping_city && (
                                          <div>
                                            {order.shipping_city}
                                            {order.shipping_state && `, ${order.shipping_state}`}
                                            {order.shipping_postal_code && ` ${order.shipping_postal_code}`}
                                          </div>
                                        )}
                                        {order.shipping_country && <div>{order.shipping_country}</div>}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Order Items */}
                                {order.order_items && order.order_items.length > 0 && (
                                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                      </svg>
                                      Order Items ({order.order_items.length})
                                    </h4>
                                    <div className="space-y-3">
                                      {order.order_items.map((item, index) => (
                                        <div key={item.id || index} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                          <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                                            {item.product_image ? (
                                              <Image
                                                src={item.product_image}
                                                alt={item.product_name}
                                                fill
                                                className="object-cover"
                                                sizes="48px"
                                              />
                                            ) : (
                                              <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                              </div>
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
                                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate">
                                                Service: {item.product_clientpathurl}
                                              </p>
                                            )}
                                          </div>
                                          
                                          <div className="text-right flex-shrink-0">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                              ${item.unit_price.toFixed(2)} × {item.quantity}
                                            </div>
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                                              ${item.total_price.toFixed(2)}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Order Summary */}
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    Order Summary
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                      <span className="text-gray-900 dark:text-white">${order.subtotal.toFixed(2)}</span>
                                    </div>
                                    {order.shipping_cost > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                                        <span className="text-gray-900 dark:text-white">${order.shipping_cost.toFixed(2)}</span>
                                      </div>
                                    )}
                                    {order.tax_amount > 0 && (
                                      <div className="flex justify-between">
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

                                {/* Payment Information */}
                                                                {(order.stripe_session_id || order.stripe_payment_intent_id) && (
                                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                      </svg>
                                      Payment Information
                                    </h4>
                                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 font-mono">
                                      {order.stripe_session_id && (
                                        <div>
                                          <span className="font-medium text-gray-700 dark:text-gray-300">Session ID:</span>
                                          <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs break-all">
                                            {order.stripe_session_id}
                                          </div>
                                        </div>
                                      )}
                                      {order.stripe_payment_intent_id && (
                                        <div>
                                          <span className="font-medium text-gray-700 dark:text-gray-300">Payment Intent:</span>
                                          <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs break-all">
                                            {order.stripe_payment_intent_id}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Order Timeline */}
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Order Timeline
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      <div className="text-sm">
                                        <span className="font-medium text-gray-900 dark:text-white">Order Created</span>
                                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                                          {formatDate(order.created_at)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-2 h-2 rounded-full ${
                                        order.status !== 'pending' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                      }`}></div>
                                      <div className="text-sm">
                                        <span className="font-medium text-gray-900 dark:text-white">Last Updated</span>
                                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                                          {formatDate(order.updated_at)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Enhanced Footer with Summary */}
            {orders.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-2 lg:space-y-0">
                  <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center">
                      <span className="font-medium text-gray-900 dark:text-white mr-1">{stats.total}</span>
                      Total Orders
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      <span className="font-medium text-gray-900 dark:text-white mr-1">{stats.pending}</span>
                      Pending
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      <span className="font-medium text-gray-900 dark:text-white mr-1">{stats.processing}</span>
                      Processing
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="font-medium text-gray-900 dark:text-white mr-1">{stats.delivered}</span>
                      Delivered
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      <span className="font-medium text-gray-900 dark:text-white mr-1">${stats.totalRevenue.toFixed(2)}</span>
                      Revenue
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Last updated: {new Date().toLocaleString()}
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

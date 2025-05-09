'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function AdminDashboardPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not logged in or not admin
    if (!loading && (!user || !isAdmin)) {
      router.push('/login');
    }
  }, [user, loading, isAdmin, router]);

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

  if (!user || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Admin Dashboard
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6 flex flex-col h-full">
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Products
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4 flex-grow">
                  Manage your product catalog, update details, and control inventory.
                </p>
                <Button
                  variant="primary"
                  onClick={() => router.push('/admin/products')}
                  className="w-full"
                >
                  Manage Products
                </Button>
              </Card>
              
              <Card className="p-6 flex flex-col h-full">
                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Orders
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4 flex-grow">
                  View and manage customer orders, track shipments, and process returns.
                </p>
                <Button
                  variant="primary"
                  onClick={() => router.push('/admin/orders')}
                  className="w-full"
                >
                  Manage Orders
                </Button>
              </Card>
              
              <Card className="p-6 flex flex-col h-full">
                <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Customers
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4 flex-grow">
                  View customer information, purchase history, and manage accounts.
                </p>
                <Button
                  variant="primary"
                  onClick={() => router.push('/admin/customers')}
                  className="w-full"
                >
                  Manage Customers
                </Button>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Activity
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-2 rounded-full mr-3">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">
                        New product added
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        2 hours ago
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-2 rounded-full mr-3">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">
                        New order received
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        4 hours ago
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 p-2 rounded-full mr-3">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">
                        New customer registered
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        6 hours ago
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Stats
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      Total Products
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      24
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      Total Orders
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      18
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      Total Customers
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      12
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      Revenue
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      $2,450
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
import { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin Login - Aero Tech Labs',
  description: 'Admin login for Aero Tech Labs',
};

function LoginContent() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
            Admin Portal
          </h1>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
            Sign in to access the admin dashboard
          </p>
        </div>
        
        <LoginForm />
        
        {/* Additional Help Links */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Need help accessing your account?
            </p>
            <div className="flex justify-center space-x-4 text-xs">
              <Link 
                href="/auth/forgot-password-9f3b2" 
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
              >
                Reset Password
              </Link>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <Link 
                href="/auth/register-9f3b2" 
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
              >
                Create Account
              </Link>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <Link 
                href="/" 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}

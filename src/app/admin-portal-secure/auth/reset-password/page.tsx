import { Metadata } from 'next';
import { Suspense } from 'react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password - Aero Tech Labs',
  description: 'Set your new admin password',
};

function ResetPasswordContent() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
            Reset Password
          </h1>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </main>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
import { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Admin Login - Aero Tech Labs',
  description: 'Admin login for Aero Tech Labs',
};

export default function LoginPage() {
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
      </div>
    </main>
  );
}
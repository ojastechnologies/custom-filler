import { Metadata } from 'next';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Admin Register - Aero Tech Labs',
  description: 'Create admin account for Aero Tech Labs',
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
            Create Admin Account
          </h1>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
            Register a new admin account
          </p>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}
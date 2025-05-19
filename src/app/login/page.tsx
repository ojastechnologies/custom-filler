import { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Sign In - Aero Tech Labs',
  description: 'Sign in to your Aero Tech Labs account',
};

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            Sign In
          </h1>
          <LoginForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
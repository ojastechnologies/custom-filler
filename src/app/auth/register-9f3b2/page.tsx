import { Metadata } from 'next';
import RegisterForm from '@/components/auth/RegisterForm';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Create Account - Aero Tech Labs',
  description: 'Create a new account with Aero Tech Labs',
};

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            Create an Account
          </h1>
          <RegisterForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
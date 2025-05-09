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
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <RegisterForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
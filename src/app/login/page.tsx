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
          <LoginForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
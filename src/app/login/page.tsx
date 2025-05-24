import { Metadata } from 'next';
import { redirect } from 'next/navigation';

// import LoginForm from '@/components/auth/LoginForm';
// import Header from '@/components/layout/Header';
// import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Sign In - Aero Tech Labs',
  description: 'Sign in to your Aero Tech Labs account',
};

export default function LoginPage() {
  redirect('/auth/enter-portal-9f3b2');

  return null;
}
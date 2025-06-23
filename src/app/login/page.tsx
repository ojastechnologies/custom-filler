import { Metadata } from 'next';

// import LoginForm from '@/components/auth/LoginForm';
// import Header from '@/components/layout/Header';
// import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Sign In - Aero Tech Labs',
  description: 'Sign in to your Aero Tech Labs account',
};

import AnimatedNotFound from '@/components/ui/AnimatedNotFound';

export default function LoginPage() {
  return (
    <AnimatedNotFound
      title="Not Found"
      message="T"
      showHomeButton={true}
    />
  );
}
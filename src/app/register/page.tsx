import { Metadata } from 'next';
import AnimatedNotFound from '@/components/ui/AnimatedNotFound';

export const metadata: Metadata = {
  title: 'Create Account - Aero Tech Labs',
  description: 'Create a new account with Aero Tech Labs',
};

export default function RegisterPage() {
  return (
    <AnimatedNotFound
      title="Registration Unavailable"
      message="Public registration is currently disabled. Please contact the administrator for access."
      showHomeButton={true}
    />
  );
}
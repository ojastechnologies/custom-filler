import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Create Account - Aero Tech Labs',
  description: 'Create a new account with Aero Tech Labs',
};

export default function RegisterPage() {
  // Always return 404 for public access
  notFound();
}
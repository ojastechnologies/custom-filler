'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

// Define a proper error type
interface AuthError {
  message: string;
  status?: number;
}

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Sign up the user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      // 2. Update the profile with additional information
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            full_name: fullName 
          })
          .eq('user_id', data.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          // Continue anyway since the user was created
        }
      }
      
      // Show success message
      setSuccessMessage('Registration successful! Please check your email to verify your account.');
      
      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      
      // Redirect to login page after a delay
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 3000);
      
    } catch (err: unknown) {
      // Use type assertion with our custom error type
      const authError = err as AuthError;
      setError(authError.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Create an Account
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-sm">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Must be at least 6 characters
          </p>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            placeholder="••••••••"
          />
        </div>
        
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link 
            href="/login" 
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  );
}

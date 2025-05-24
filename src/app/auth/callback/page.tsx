'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Fix: Remove unused variables by not destructuring them
      // Instead of:
      // const { data: authData, error: _ } = await supabase.auth.getSession();
      
      // Just call the method without storing the result:
      await supabase.auth.getSession();
      
      // Redirect to login page regardless of result
      router.push('/auth/enter-portal-9f3b2');
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Processing your authentication...</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">You will be redirected shortly.</p>
      </div>
    </div>
  );
}
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Import the same values used in your supabaseClient.ts
const supabaseUrl = "https://vrfpayooyasvetbxkjam.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZnBheW9veWFzdmV0YnhramFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTIzODUsImV4cCI6MjA2MjA4ODM4NX0.HQVZ1H0wjFLILScEo0JhZIt7dPQ-f5QHEUePMvubn3o";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Pass the URL and key directly
  const supabase = createMiddlewareClient({ req, res }, {
    supabaseUrl,
    supabaseKey
  });
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  // If accessing admin routes, check if user is admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      // Not logged in, redirect to login
      return NextResponse.redirect(new URL('/login?redirectTo=' + req.nextUrl.pathname, req.url));
    }
    
    // For admin check, we'll rely on client-side verification
    // This is less secure but avoids needing to query the database in middleware
  }
  
  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};
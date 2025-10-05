import { NextResponse } from 'next/server';
import { getServerStripe } from '@/lib/stripe';

export async function GET() {
  try {
    // Get the server-side Stripe instance
    const stripe = getServerStripe();
    
    // Test if Stripe is properly configured
    const account = await stripe.accounts.retrieve();
    
    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        country: account.country,
        default_currency: account.default_currency,
        email: account.email,
        type: account.type
      }
    });
  } catch (error: unknown) {
    console.error('❌ Stripe verification failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Stripe verification failed',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
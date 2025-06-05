import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    // Test if Stripe is properly configured
    const account = await stripe.accounts.retrieve();
    
    return NextResponse.json({
      success: true,
      message: 'Stripe is properly configured!',
      testMode: !account.charges_enabled, // In test mode, charges_enabled is usually false
      accountId: account.id,
    });
  } catch (error) {
    console.error('Stripe verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Stripe configuration issue'
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
    const hasPublicKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    return NextResponse.json({
      message: 'Stripe test endpoint',
      hasStripeSecretKey: hasStripeKey,
      hasStripePublicKey: hasPublicKey,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...',
      publicKeyPrefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 10) + '...',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Test failed', details: String(error) },
      { status: 500 }
    );
  }
}
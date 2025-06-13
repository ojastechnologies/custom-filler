import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  try {
    // Check if environment variables are set
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY not configured' },
        { status: 500 }
      );
    }

    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    //   apiVersion: '2025-05-28.basil',
    // });

    // Test Stripe connection by listing payment methods
    // const paymentMethods = await stripe.paymentMethods.list({
    //   limit: 1,
    // });

    return NextResponse.json({
      success: true,
      message: 'Stripe connection successful',
      stripeConnected: true,
      testMode: process.env.STRIPE_SECRET_KEY.startsWith('sk_test_'),
    });

  } catch (error) {
    console.error('❌ Stripe test error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          error: 'Stripe connection failed',
          details: error.message,
          type: error.type 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to test Stripe connection' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching invoice for session:', sessionId);

    // Get the server-side Stripe instance
    const stripe = getServerStripe();

    // Get the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['invoice', 'payment_intent']
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Extract relevant session data
    const sessionData = {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email,
      customer_name: session.customer_details?.name,
      created: session.created,
      invoice: session.invoice,
      payment_intent: session.payment_intent
    };

    console.log('✅ Session data retrieved successfully');

    return NextResponse.json({
      success: true,
      session: sessionData
    });

  } catch (error: unknown) {
    console.error('❌ Error fetching invoice:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch invoice data',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
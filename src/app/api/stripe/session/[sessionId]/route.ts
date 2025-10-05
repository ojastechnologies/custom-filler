import { NextRequest, NextResponse } from 'next/server';
import { getOrderFromStripeSession, updateOrderWithStripeData } from '@/services/stripeOrderService';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;
    
    console.log('🔍 API: Fetching session data for:', sessionId);

    if (!sessionId || !sessionId.startsWith('cs_')) {
      return NextResponse.json(
        { error: 'Invalid session ID provided' },
        { status: 400 }
      );
    }

    // Get complete order data from Stripe
    const stripeData = await getOrderFromStripeSession(sessionId);
    
    // Try to find the order in our database using the session ID
    const { data: dbOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    // If we found the order, update it with complete Stripe data
    if (dbOrder) {
      const { order: updatedOrder } = await updateOrderWithStripeData(dbOrder.id, sessionId);
      
      return NextResponse.json({
        success: true,
        order: updatedOrder,
        stripeData: stripeData,
        source: 'database_updated'
      });
    }

    // If no order found in database, return just the Stripe data
    return NextResponse.json({
      success: true,
      stripeData: stripeData,
      source: 'stripe_only',
      message: 'No matching order found in database'
    });

  } catch (error: unknown) {
    console.error('❌ API Error fetching session:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch session data',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
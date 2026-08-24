import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;
    const stripe = getServerStripe();

    console.log('🔍 Fetching Stripe session:', sessionId);

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session with customer details
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'payment_intent', 'line_items']
    });

    console.log('✅ Stripe session retrieved:', session.id);

    // Extract customer information
    const customerInfo = {
      email: session.customer_email || session.customer_details?.email || '',
      name: session.customer_details?.name || '',
      phone: session.customer_details?.phone || '',
      address: session.customer_details?.address || null
    };

    // Extract payment information
    const paymentInfo = {
      payment_status: session.payment_status,
      amount_total: session.amount_total || 0,
      currency: session.currency || 'usd',
      payment_intent_id: typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : session.payment_intent?.id || ''
    };

    // Get line items if available
    let lineItems: Array<{
      product_name: string;
      quantity: number;
      amount_total: number;
    }> = [];

    if (session.line_items && session.line_items.data) {
      lineItems = session.line_items.data.map(item => ({
        product_name: item.description || '',
        quantity: item.quantity || 0,
        amount_total: item.amount_total || 0
      }));
    }

    const stripeData = {
      customerInfo,
      paymentInfo,
      lineItems
    };

    // 🔥 OPTIMIZED: Only update order if customer information is missing
    if (session.metadata?.order_id) {
      const orderId = session.metadata.order_id;
      
      // First, check if the order already has customer information
      const { data: currentOrder, error: fetchCurrentError } = await supabase
        .from('orders')
        .select('customer_email, customer_name, stripe_session_id')
        .eq('id', orderId)
        .single();

      if (fetchCurrentError) {
        console.error('❌ Error fetching current order:', fetchCurrentError);
      } else {
        console.log('📋 Current order data:', {
          customer_email: currentOrder?.customer_email,
          customer_name: currentOrder?.customer_name,
          stripe_session_id: currentOrder?.stripe_session_id
        });

        // 🔥 CRITICAL CHECK: Only update if customer info is missing or incomplete
        const isPaid = paymentInfo.payment_status === 'paid';
        const needsUpdate =
          !currentOrder?.customer_name ||
          currentOrder?.customer_email === 'pending@stripe.com' ||
          !currentOrder?.stripe_session_id;

        if (needsUpdate) {
          console.log('📝 Customer information missing - updating order with Stripe data');

          // The cart hits this route BEFORE redirecting to Stripe just to link
          // the session id. On such unpaid sessions, customer_details are empty
          // — writing them would blank the order AND flipping status here made
          // notifications fire before reconciliation. Until payment settles,
          // link identifiers only; leave customer fields and status alone.
          const baseUpdateData: Record<string, unknown> = {
            stripe_session_id: sessionId,
            updated_at: new Date().toISOString()
          };

          if (paymentInfo.payment_intent_id) {
            baseUpdateData.stripe_payment_intent_id = paymentInfo.payment_intent_id;
          }

          if (isPaid) {
            baseUpdateData.customer_email = customerInfo.email;
            baseUpdateData.customer_name = customerInfo.name || null;
            baseUpdateData.customer_phone = customerInfo.phone || null;
            baseUpdateData.status = 'processing';

            // Add shipping address fields if available
            if (customerInfo.address) {
              baseUpdateData.shipping_line1 = customerInfo.address.line1 || null;
              baseUpdateData.shipping_line2 = customerInfo.address.line2 || null;
              baseUpdateData.shipping_city = customerInfo.address.city || null;
              baseUpdateData.shipping_state = customerInfo.address.state || null;
              baseUpdateData.shipping_postal_code = customerInfo.address.postal_code || null;
              baseUpdateData.shipping_country = customerInfo.address.country || null;
            }
          } else {
            console.log('⏳ Session not paid yet - linking session id only, deferring customer data');
          }

          console.log('📤 Updating order with:', baseUpdateData);

          // Update the order with customer information
          const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update(baseUpdateData)
            .eq('id', orderId)
            .select('*')
            .single();

          if (updateError) {
            console.error('❌ Error updating order:', updateError);
          } else {
            console.log('✅ Order updated successfully:', {
              order_number: updatedOrder?.order_number,
              customer_email: updatedOrder?.customer_email,
              customer_name: updatedOrder?.customer_name
            });
          }
        } else {
          console.log('✅ Order already has complete customer information - skipping update');
        }
      }

      // Fetch the complete order data with items for the response
      const { data: orderWithItems, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            unit_price,
            quantity,
            product_image,
            total_price
          )
        `)
        .eq('id', orderId)
        .single();

      if (!fetchError && orderWithItems) {
        // Format the order response to match expected interface
        const formattedOrder = {
          ...orderWithItems,
          items: (orderWithItems.order_items || []).map((item: {
            id: string;
            product_id: string;
            product_name: string;
            unit_price: number;
            quantity: number;
            product_image: string;
            total_price: number;
          }) => ({
            id: item.id,
            product_id: item.product_id,
            name: item.product_name,
            price: item.unit_price,
            quantity: item.quantity,
            image: item.product_image,
            total_price: item.total_price
          }))
        };
        delete (formattedOrder as { order_items?: unknown }).order_items;

        return NextResponse.json({
          success: true,
          stripeData,
          order: formattedOrder,
          message: 'Order data retrieved successfully'
        });
      }
    } else {
      console.warn('⚠️ No order_id found in session metadata');
    }

    // Return Stripe data even if order update fails or no order_id
    return NextResponse.json({
      success: true,
      stripeData,
      message: 'Stripe session data retrieved successfully'
    });

  } catch (error: unknown) {
    console.error('❌ Error fetching Stripe session:', error);
    
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
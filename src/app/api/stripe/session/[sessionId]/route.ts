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
    console.log('📧 Customer email from session:', session.customer_email);
    console.log('👤 Customer details:', session.customer_details);

    // Extract customer information
    const customerInfo = {
      email: session.customer_email || session.customer_details?.email || '',
      name: session.customer_details?.name || '',
      phone: session.customer_details?.phone || '',
      address: session.customer_details?.address || null
    };

    console.log('📋 Extracted customer info:', customerInfo);

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

    // Update order using existing schema structure (individual address fields)
    if (session.metadata?.order_id) {
      console.log('📝 Updating order with customer information from Stripe session');
      
      const orderId = session.metadata.order_id;
      
      // First, let's check what the current order status is and what values are allowed
      const { data: currentOrder, error: fetchCurrentError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (fetchCurrentError) {
        console.error('❌ Error fetching current order:', fetchCurrentError);
      } else {
        console.log('📋 Current order status:', currentOrder?.status);
      }
      
      // Build base update object using existing individual address fields
      const baseUpdateData: Record<string, unknown> = {
        customer_email: customerInfo.email,
        customer_name: customerInfo.name || null,
        customer_phone: customerInfo.phone || null,
        stripe_session_id: sessionId,
        stripe_payment_intent_id: paymentInfo.payment_intent_id,
        updated_at: new Date().toISOString()
      };

      // Add shipping address fields if available
      if (customerInfo.address) {
        baseUpdateData.shipping_line1 = customerInfo.address.line1 || null;
        baseUpdateData.shipping_line2 = customerInfo.address.line2 || null;
        baseUpdateData.shipping_city = customerInfo.address.city || null;
        baseUpdateData.shipping_state = customerInfo.address.state || null;
        baseUpdateData.shipping_postal_code = customerInfo.address.postal_code || null;
        baseUpdateData.shipping_country = customerInfo.address.country || null;
      }

      // Create complete update data with status
      const updateData = {
        ...baseUpdateData,
        status: 'processing' // Valid statuses: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
      };

      console.log('📤 Update data being sent:', updateData);

      // Try the update with 'processing' status first
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select('*')
        .single();

      if (updateError) {
        console.error('❌ Error updating order with status "processing":', updateError);
        
        // If 'processing' doesn't work, try other valid statuses
        const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
        
        for (const statusToTry of validStatuses) {
          console.log(`🔄 Trying valid status: ${statusToTry}`);
          
          const { error: statusTestError } = await supabase
            .from('orders')
            .update({
              ...baseUpdateData,
              status: statusToTry
            })
            .eq('id', orderId)
            .select('*')
            .single();

          if (!statusTestError) {
            console.log(`✅ Successfully updated with status: ${statusToTry}`);
            break;
          } else {
            console.log(`❌ Status ${statusToTry} failed:`, statusTestError.message);
          }
        }
      } else {
        console.log('✅ Order updated successfully with status "processing":', {
          order_number: updatedOrder?.order_number,
          customer_email: updatedOrder?.customer_email,
          status: updatedOrder?.status
        });
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

      if (fetchError) {
        console.error('❌ Error fetching updated order:', fetchError);
      } else {
        console.log('✅ Fetched updated order:', {
          order_number: orderWithItems?.order_number,
          customer_email: orderWithItems?.customer_email,
          status: orderWithItems?.status
        });
      }

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
          message: 'Order updated with customer information from Stripe session'
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
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook received');
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ No stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified');
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('📨 Event type:', event.type);
    console.log('📨 Event ID:', event.id);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('💳 Payment successful for session:', session.id);
      
      try {
        // Retrieve the full session with line items
        console.log('🔍 Retrieving full session details...');
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items', 'line_items.data.price.product']
        });

        console.log('📦 Full session retrieved');

        // Check if order already exists (from manual creation)
        const { data: existingOrder, error: checkError } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_email', fullSession.customer_details?.email || '')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingOrder && !checkError) {
          // Update existing order with Stripe details
          console.log('📝 Updating existing order:', existingOrder.id);
          await updateExistingOrder(existingOrder.id, fullSession);
        } else {
          // Create new order from Stripe session
          console.log('🆕 Creating new order from Stripe session');
          await createOrderFromStripe(fullSession);
        }
        
        console.log('✅ Order processing completed');
        
      } catch (error) {
        console.error('❌ Error processing successful payment:', error);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function updateExistingOrder(orderId: string, session: any) {
  try {
    console.log(' Updating existing order with Stripe details...');
    
    const updateData = {
      stripe_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : session.payment_intent?.id || null,
      status: 'processing', // Update status to processing after payment
      
      // Update customer details if provided by Stripe
      customer_name: session.customer_details?.name || null,
      customer_phone: session.customer_details?.phone || null,
      
      // Update shipping address if provided
      shipping_line1: session.shipping_details?.address?.line1 || null,
      shipping_line2: session.shipping_details?.address?.line2 || null,
      shipping_city: session.shipping_details?.address?.city || null,
      shipping_state: session.shipping_details?.address?.state || null,
      shipping_postal_code: session.shipping_details?.address?.postal_code || null,
      shipping_country: session.shipping_details?.address?.country || null,
      
      // Update totals from Stripe (in case of discounts, etc.)
      subtotal: (session.amount_subtotal || 0) / 100,
      shipping_cost: (session.shipping_cost?.amount_total || 0) / 100,
      tax_amount: (session.total_details?.amount_tax || 0) / 100,
      total_amount: (session.amount_total || 0) / 100,
    };

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Error updating existing order:', updateError);
      throw updateError;
    }

    console.log('✅ Existing order updated successfully');
  } catch (error) {
    console.error('❌ Failed to update existing order:', error);
    throw error;
  }
}

async function createOrderFromStripe(session: any) {
  try {
    console.log('🆕 Creating new order from Stripe session...');
    
    // Prepare order data
    const orderData = {
      stripe_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : session.payment_intent?.id || null,
      customer_email: session.customer_details?.email || '',
      customer_name: session.customer_details?.name || null,
      customer_phone: session.customer_details?.phone || null,
      
      // Shipping Address
      shipping_line1: session.shipping_details?.address?.line1 || null,
      shipping_line2: session.shipping_details?.address?.line2 || null,
      shipping_city: session.shipping_details?.address?.city || null,
      shipping_state: session.shipping_details?.address?.state || null,
      shipping_postal_code: session.shipping_details?.address?.postal_code || null,
      shipping_country: session.shipping_details?.address?.country || null,
      
      // Order totals (convert from cents to dollars)
      subtotal: (session.amount_subtotal || 0) / 100,
      shipping_cost: (session.shipping_cost?.amount_total || 0) / 100,
      tax_amount: (session.total_details?.amount_tax || 0) / 100,
      total_amount: (session.amount_total || 0) / 100,
      currency: session.currency || 'usd',
      
      status: 'processing' // Set to processing since payment is completed
    };

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error inserting order:', orderError);
      throw orderError;
    }

    console.log('✅ Order created with ID:', order.id);

    // Save order items
    if (session.line_items?.data && session.line_items.data.length > 0) {
      const orderItems = session.line_items.data.map((item: any, index: number) => {
        const product = item.price?.product;
        return {
          order_id: order.id,
          product_id: product?.id || `stripe-item-${index}`,
          product_name: item.description || product?.name || 'Unknown Product',
          product_description: product?.description || null,
          product_image: product?.images?.[0] || null,
          quantity: item.quantity || 1,
          unit_price: (item.price?.unit_amount || 0) / 100,
          total_price: (item.amount_total || 0) / 100,
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ Error inserting order items:', itemsError);
        throw itemsError;
      }

      console.log('✅ Order items saved:', orderItems.length);
    } else {
      console.log('⚠️ No line items found in session');
    }

    console.log('🎉 Order successfully saved to database!');
    return order;

  } catch (error) {
    console.error('❌ Failed to create order from Stripe:', error);
    throw error;
  }
}
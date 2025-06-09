import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

interface OrderUpdateData {
  stripe_session_id?: string;
  stripe_payment_intent_id?: string | null;
  status?: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  shipping_line1?: string | null;
  shipping_line2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
  subtotal?: number;
  shipping_cost?: number;
  tax_amount?: number;
  total_amount?: number;
}

interface OrderItemData {
  order_id: string;
  product_id: string;
  product_name: string;
  product_description?: string | null;
  product_image?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

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

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Webhook signature verification failed:', errorMessage);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('📨 Event type:', event.type);
    console.log('📨 Event ID:', event.id);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
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

async function updateExistingOrder(orderId: string, session: Stripe.Checkout.Session) {
  try {
    console.log('📝 Updating existing order with Stripe details...');
    
    // Type assertion to access properties that might not be in the base type
    const sessionData = session as Stripe.Checkout.Session & {
      shipping_details?: {
        address?: {
          line1?: string | null;
          line2?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
        } | null;
      } | null;
      shipping_cost?: {
        amount_total?: number | null;
      } | null;
      total_details?: {
        amount_tax?: number | null;
      } | null;
    };
    
    const updateData: OrderUpdateData = {
      stripe_session_id: sessionData.id,
      stripe_payment_intent_id: typeof sessionData.payment_intent === 'string' 
        ? sessionData.payment_intent 
        : sessionData.payment_intent?.id || null,
      status: 'processing', // Update status to processing after payment
      
      // Update customer details if provided by Stripe
      customer_name: sessionData.customer_details?.name || null,
      customer_phone: sessionData.customer_details?.phone || null,
      
      // Update shipping address if provided
      shipping_line1: sessionData.shipping_details?.address?.line1 || null,
      shipping_line2: sessionData.shipping_details?.address?.line2 || null,
      shipping_city: sessionData.shipping_details?.address?.city || null,
      shipping_state: sessionData.shipping_details?.address?.state || null,
      shipping_postal_code: sessionData.shipping_details?.address?.postal_code || null,
      shipping_country: sessionData.shipping_details?.address?.country || null,
      
      // Update totals from Stripe (in case of discounts, etc.)
      subtotal: (sessionData.amount_subtotal || 0) / 100,
      shipping_cost: (sessionData.shipping_cost?.amount_total || 0) / 100,
      tax_amount: (sessionData.total_details?.amount_tax || 0) / 100,
      total_amount: (sessionData.amount_total || 0) / 100,
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

async function createOrderFromStripe(session: Stripe.Checkout.Session) {
  try {
    console.log('🆕 Creating new order from Stripe session...');
    
    // Type assertion to access properties that might not be in the base type
    const sessionData = session as Stripe.Checkout.Session & {
      shipping_details?: {
        address?: {
          line1?: string | null;
          line2?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
        } | null;
      } | null;
      shipping_cost?: {
        amount_total?: number | null;
      } | null;
      total_details?: {
        amount_tax?: number | null;
      } | null;
    };
    
    // Prepare order data
    const orderData: OrderUpdateData = {
      stripe_session_id: sessionData.id,
      stripe_payment_intent_id: typeof sessionData.payment_intent === 'string' 
        ? sessionData.payment_intent 
        : sessionData.payment_intent?.id || null,
      customer_email: sessionData.customer_details?.email || '',
      customer_name: sessionData.customer_details?.name || null,
      customer_phone: sessionData.customer_details?.phone || null,
      
      // Shipping Address
      shipping_line1: sessionData.shipping_details?.address?.line1 || null,
      shipping_line2: sessionData.shipping_details?.address?.line2 || null,
      shipping_city: sessionData.shipping_details?.address?.city || null,
      shipping_state: sessionData.shipping_details?.address?.state || null,
      shipping_postal_code: sessionData.shipping_details?.address?.postal_code || null,
      shipping_country: sessionData.shipping_details?.address?.country || null,
      
      // Order totals (convert from cents to dollars)
      subtotal: (sessionData.amount_subtotal || 0) / 100,
      shipping_cost: (sessionData.shipping_cost?.amount_total || 0) / 100,
      tax_amount: (sessionData.total_details?.amount_tax || 0) / 100,
      total_amount: (sessionData.amount_total || 0) / 100,
      
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
    if (sessionData.line_items?.data && sessionData.line_items.data.length > 0) {
      const orderItems: OrderItemData[] = sessionData.line_items.data.map((item: Stripe.LineItem, index: number) => {
        const product = item.price?.product as Stripe.Product | undefined;
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
import { getServerStripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';
import Stripe from 'stripe';

export interface StripeOrderData {
  session: Stripe.Checkout.Session;
  customerInfo: {
    email: string;
    name: string;
    phone: string;
    address: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    } | null;
  };
  lineItems: Array<{
    stripe_price_id?: string;
    stripe_product_id: string;
    quantity?: number | null;
    amount_total?: number | null;
    amount_subtotal?: number | null;
    description?: string | null;
    product_name: string;
    product_description: string;
    unit_amount?: number | null;
  }>;
  paymentInfo: {
    payment_intent_id?: string;
    payment_status: string;
    amount_total?: number | null;
    amount_subtotal?: number | null;
    currency: string;
    created: number;
    expires_at: number | null;
  };
  metadata: Stripe.MetadataParam;
}

export const getOrderFromStripeSession = async (sessionId: string): Promise<StripeOrderData> => {
  try {
    console.log('🔍 Fetching Stripe session:', sessionId);
    
    // Get the server-side Stripe instance
    const stripe = getServerStripe();
    
    // Get the checkout session with expanded data
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: [
        'customer',
        'line_items',
        'line_items.data.price.product',
        'payment_intent',
        'invoice'
      ]
    });

    console.log('✅ Stripe session retrieved:', {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      customer_name: session.customer_details?.name,
      amount_total: session.amount_total
    });

    // Extract customer information
    const customerInfo = {
      email: session.customer_details?.email || '',
      name: session.customer_details?.name || '',
      phone: session.customer_details?.phone || '',
      address: session.customer_details?.address ? {
        line1: session.customer_details.address.line1 || '',
        line2: session.customer_details.address.line2 || '',
        city: session.customer_details.address.city || '',
        state: session.customer_details.address.state || '',
        postal_code: session.customer_details.address.postal_code || '',
        country: session.customer_details.address.country || ''
      } : null
    };

    // Extract line items with product details
    const lineItems = session.line_items?.data.map(item => {
      // Safely extract product information
      const product = item.price?.product;
      let productName = '';
      let productDescription = '';
      let stripeProductId = '';

      if (typeof product === 'string') {
        stripeProductId = product;
      } else if (product && typeof product === 'object') {
        stripeProductId = product.id || '';
        // Use type assertion with safe fallbacks
        const productObj = product as Stripe.Product;
        productName = productObj.name || '';
        productDescription = productObj.description || '';
      }

      return {
        stripe_price_id: item.price?.id,
        stripe_product_id: stripeProductId,
        quantity: item.quantity,
        amount_total: item.amount_total,
        amount_subtotal: item.amount_subtotal,
        description: item.description,
        product_name: productName,
        product_description: productDescription,
        unit_amount: item.price?.unit_amount
      };
    }) || [];

    // Extract payment information
    const paymentInfo = {
      payment_intent_id: typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : session.payment_intent?.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      amount_subtotal: session.amount_subtotal,
      currency: session.currency || 'usd',
      created: session.created,
      expires_at: session.expires_at
    };

    return {
      session,
      customerInfo,
      lineItems,
      paymentInfo,
      metadata: session.metadata || {}
    };

  } catch (error) {
    console.error('❌ Error fetching Stripe session:', error);
    throw error;
  }
};

export const updateOrderWithStripeData = async (orderId: string, sessionId: string) => {
  try {
    console.log('🔄 Updating order with Stripe data:', { orderId, sessionId });

    // Get complete order data from Stripe
    const stripeData = await getOrderFromStripeSession(sessionId);
    
    // Update your database order with the complete customer information
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        customer_name: stripeData.customerInfo.name,
        customer_email: stripeData.customerInfo.email,
        customer_phone: stripeData.customerInfo.phone,
        shipping_address: stripeData.customerInfo.address,
        payment_intent_id: stripeData.paymentInfo.payment_intent_id,
        payment_status: stripeData.paymentInfo.payment_status,
        stripe_amount_total: stripeData.paymentInfo.amount_total,
        stripe_currency: stripeData.paymentInfo.currency,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating order with Stripe data:', error);
      throw error;
    }

    console.log('✅ Order updated with complete Stripe data:', updatedOrder?.order_number);
    return { order: updatedOrder, stripeData };

  } catch (error) {
    console.error('❌ Error in updateOrderWithStripeData:', error);
    throw error;
  }
};
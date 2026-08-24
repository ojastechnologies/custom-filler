import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/lib/stripe';
import Stripe from 'stripe';

interface CheckoutItem {
  price: number;
  name: string;
  description?: string;
  image?: string;
  id: string;
  originalPrice?: number;
  productDiscountAmount?: number;
  clientpathurl?: string;
  quantity: number;
}

interface AppliedDeal {
  deal: {
    id: string;
    code: string;
    description?: string;
    discount_type: string;
    discount_value: number;
  };
  discountAmount: number;
}

interface CheckoutData {
  orderId: string;
  orderNumber: string;
  items: CheckoutItem[];
  appliedDeal?: AppliedDeal;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get the server-side Stripe instance
    const stripe = getServerStripe();
    
    const body = await request.json() as CheckoutData;
    const { 
      orderId, 
      orderNumber, 
      items, 
      appliedDeal, 
      customerEmail,
      successUrl, 
      cancelUrl 
    } = body;

    console.log('🛒 Creating Stripe checkout session for order:', orderNumber);

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided for checkout' },
        { status: 400 }
      );
    }

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: CheckoutItem) => {
      // Calculate price in cents (Stripe uses cents)
      const unitAmount = Math.round(item.price * 100);

      // Stripe requires ABSOLUTE image URLs and hard-fails the whole session
      // otherwise ("Not a valid URL"). Relative paths (e.g. local thumbnails)
      // are dropped rather than breaking checkout.
      const imageUrl = item.image && /^https?:\/\//i.test(item.image.trim()) ? item.image.trim() : undefined;

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            // Empty strings are rejected by the Stripe API ("attempt to unset
            // a parameter"); omit the field entirely instead.
            ...(item.description && item.description.trim() ? { description: item.description.trim() } : {}),
            images: imageUrl ? [imageUrl] : [],
            metadata: {
              product_id: item.id,
              original_price: item.originalPrice?.toString() || item.price.toString(),
              product_discount: item.productDiscountAmount?.toString() || '0',
              clientpathurl: item.clientpathurl || ''
            }
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      };
    });

    // 🔥 FIXED: Use Stripe's actual type for session configuration
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        order_id: orderId,
        order_number: orderNumber,
        deal_code: appliedDeal?.deal?.code || '',
        deal_discount: appliedDeal?.discountAmount?.toString() || '0'
      },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      phone_number_collection: {
        enabled: true,
      },
    };

    // 🔥 FIXED: Only set customer_email if provided, otherwise Stripe will prompt for it
    if (customerEmail && customerEmail !== 'pending@stripe.com') {
      sessionConfig.customer_email = customerEmail;
      console.log('💌 Pre-filling customer email:', customerEmail);
    } else {
      console.log('💌 Customer email will be collected by Stripe');
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Stripe checkout session created:', session.id);

    return NextResponse.json({
      url: session.url,
      sessionId: session.id
    });

  } catch (error: unknown) {
    console.error('❌ Stripe checkout error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: errorMessage || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
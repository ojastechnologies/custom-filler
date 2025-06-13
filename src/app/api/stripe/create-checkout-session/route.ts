import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';
import Stripe from 'stripe';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
  clientpathurl?: string;
}

interface StripeProductData {
  name: string;
  description?: string;
  images?: string[];
  metadata?: Record<string, string>;
}

type StripeSessionConfig = Partial<Stripe.Checkout.SessionCreateParams> & {
  payment_method_types: string[];
  line_items: Stripe.Checkout.SessionCreateParams.LineItem[];
  mode: 'payment' | 'setup' | 'subscription';
  success_url: string;
  cancel_url: string;
  metadata: Record<string, string>;
};

// Helper function to validate URL
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Stripe Checkout Session Creation ===');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { items, customer_email, deal } = body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Invalid items:', items);
      return NextResponse.json(
        { error: 'No valid items provided' },
        { status: 400 }
      );
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as CartItem;
      if (!item.name || !item.price || !item.quantity) {
        console.error(`Invalid item at index ${i}:`, item);
        return NextResponse.json(
          { error: `Invalid item structure at index ${i}` },
          { status: 400 }
        );
      }
      
      if (typeof item.price !== 'number' || item.price <= 0) {
        console.error(`Invalid price for item ${i}:`, item.price);
        return NextResponse.json(
          { error: `Invalid price for item: ${item.name}` },
          { status: 400 }
        );
      }
    }

    // Create line items for Stripe
    const lineItems = items.map((item: CartItem) => {
      const productData: StripeProductData = {
        name: item.name,
        metadata: {
          product_id: item.id,
          clientpathurl: item.clientpathurl || ''
        }
      };

      if (item.description && item.description.trim() !== '') {
        productData.description = item.description.trim();
      }

      if (item.image && 
          item.image.trim() !== '' && 
          item.image !== '/placeholder-product.jpg' &&
          !item.image.includes('placeholder') &&
          isValidUrl(item.image)) {
        
        console.log(`Adding valid image URL for ${item.name}:`, item.image);
        productData.images = [item.image];
      } else {
        console.log(`Skipping invalid/placeholder image for ${item.name}:`, item.image);
      }

      const lineItem = {
        price_data: {
          currency: 'usd',
          product_data: productData,
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      };
      
      console.log('Created line item:', JSON.stringify(lineItem, null, 2));
      return lineItem;
    });

    console.log('Creating Stripe session with line items:', lineItems.length);

    // Prepare session configuration
    const sessionConfig: StripeSessionConfig = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/checkout/cancel`,
      customer_email: customer_email || undefined,
      metadata: {
        order_type: 'online_purchase',
        items_count: items.length.toString(),
        customer_email: customer_email || '',
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB'],
      },
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
    };

    // Add deal information to metadata and apply discount if present
    if (deal && deal.id && deal.code && deal.discount_amount) {
      console.log('Adding deal to session:', deal);
      sessionConfig.metadata.deal_id = deal.id;
      sessionConfig.metadata.deal_code = deal.code;
      sessionConfig.metadata.discount_amount = deal.discount_amount.toString();

      // Apply discount using Stripe coupons
      try {
        const coupon = await stripe.coupons.create({
          amount_off: Math.round(deal.discount_amount * 100), // Convert to cents
          currency: 'usd',
          duration: 'once',
          name: `Deal: ${deal.code}`,
          max_redemptions: 1,
        });

        sessionConfig.discounts = [{
          coupon: coupon.id,
        }];

        console.log('Created Stripe coupon:', coupon.id);

        // Track deal usage
        if (customer_email) {
          try {
            await supabase
              .from('deal_usage')
              .insert([{
                deal_id: deal.id,
                customer_email: customer_email,
                discount_amount: deal.discount_amount,
              }]);

            // Increment usage count
            await supabase
              .from('deals')
              .update({ 
                usage_count: deal.usage_count + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', deal.id);

            console.log('Deal usage tracked successfully');
          } catch (usageError) {
            console.error('Error tracking deal usage:', usageError);
            // Continue with checkout even if usage tracking fails
          }
        }

      } catch (couponError) {
        console.error('Error creating coupon:', couponError);
        // Continue without coupon - we'll handle discount in our system
      }
    }

    console.log('Creating Stripe session with config:', JSON.stringify(sessionConfig, null, 2));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('Stripe session created successfully:', session.id);
    console.log('Session URL:', session.url);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('=== Stripe Checkout Error ===');
    console.error('Error details:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
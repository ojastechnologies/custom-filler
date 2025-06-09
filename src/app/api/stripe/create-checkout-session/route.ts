import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    description?: string;
    image_url?: string;
  };
  quantity: number;
}

interface StripeProductData {
  name: string;
  description?: string;
  images?: string[];
}

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
    
    const { items, customer_email } = body;

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
      if (!item.product || !item.product.name || !item.product.price || !item.quantity) {
        console.error(`Invalid item at index ${i}:`, item);
        return NextResponse.json(
          { error: `Invalid item structure at index ${i}` },
          { status: 400 }
        );
      }
      
      if (typeof item.product.price !== 'number' || item.product.price <= 0) {
        console.error(`Invalid price for item ${i}:`, item.product.price);
        return NextResponse.json(
          { error: `Invalid price for item: ${item.product.name}` },
          { status: 400 }
        );
      }
    }

    // Create line items for Stripe
    const lineItems = items.map((item: CartItem) => {
      // Build product_data object with proper typing
      const productData: StripeProductData = {
        name: item.product.name,
      };

      // Only add description if it exists and is not empty
      if (item.product.description && item.product.description.trim() !== '') {
        productData.description = item.product.description.trim();
      }

      // Only add images if image_url exists, is not empty, and is a valid URL
      if (item.product.image_url && 
          item.product.image_url.trim() !== '' && 
          item.product.image_url !== '/placeholder-product.jpg' &&
          !item.product.image_url.includes('placeholder') &&
          isValidUrl(item.product.image_url)) {
        
        console.log(`Adding valid image URL for ${item.product.name}:`, item.product.image_url);
        productData.images = [item.product.image_url];
      } else {
        console.log(`Skipping invalid/placeholder image for ${item.product.name}:`, item.product.image_url);
      }

      const lineItem = {
        price_data: {
          currency: 'usd',
          product_data: productData,
          unit_amount: Math.round(item.product.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
      
      console.log('Created line item:', JSON.stringify(lineItem, null, 2));
      return lineItem;
    });

    console.log('Creating Stripe session with line items:', lineItems.length);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/checkout/cancel`,
      customer_email: customer_email || undefined,
      metadata: {
        order_type: 'online_purchase',
        items_count: items.length.toString(),
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB'],
      },
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
    });

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
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe'; // 🔥 Use your main Stripe instance

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
  clientpathurl?: string;
}

interface AppliedDeal {
  deal: {
    id: string;
    code: string;
    description: string;
  };
  discountAmount: number;
}

interface CheckoutRequestBody {
  orderId: string;
  items: CartItem[];
  appliedDeal?: AppliedDeal;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Stripe checkout API called');

    let requestBody: CheckoutRequestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { orderId, items, appliedDeal, customerEmail, successUrl, cancelUrl } = requestBody;

    console.log('🛒 Creating checkout session for order:', orderId);
    console.log('📦 Items:', items);
    console.log('🎫 Applied deal:', appliedDeal);

    // Validate required fields
    if (!orderId || !items || items.length === 0 || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = appliedDeal ? Math.min(appliedDeal.discountAmount, subtotal) : 0;
    const finalTotal = Math.max(0.50, subtotal - discountAmount);

    console.log('💰 Calculations:', { subtotal, discountAmount, finalTotal });

    // Validate amounts
    if (subtotal <= 0) {
      return NextResponse.json(
        { error: 'Cart total must be greater than $0' },
        { status: 400 }
      );
    }

    // Create line items for Stripe
    const lineItems = items.map((item: CartItem) => {
      const itemTotal = item.price * item.quantity;
      const itemDiscountRatio = discountAmount > 0 ? (itemTotal / subtotal) : 0;
      const itemDiscount = discountAmount * itemDiscountRatio;
      const discountedItemPrice = Math.max(0.01, item.price - (itemDiscount / item.quantity));

      console.log(`📦 Item: ${item.name}, Original: ${item.price}, Discounted: ${discountedItemPrice.toFixed(2)}`);

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: appliedDeal ? `${item.name} (${appliedDeal.deal.code} applied)` : item.name,
            description: item.description || undefined,
            images: item.image && item.image !== '/placeholder-product.jpg' ? [item.image] : undefined,
          },
          unit_amount: Math.round(discountedItemPrice * 100),
        },
        quantity: item.quantity,
      };
    });

    console.log('💰 Line items created:', lineItems.length);

    // Create checkout session
    const sessionParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment' as const,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail || undefined,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      metadata: {
        orderId: orderId,
        cartItems: JSON.stringify(items),
        appliedDeal: appliedDeal ? JSON.stringify(appliedDeal) : '',
        customerEmail: customerEmail || '',
        originalSubtotal: subtotal.toString(),
        discountAmount: discountAmount.toString(),
      },
    };

    console.log('🔄 Creating Stripe session...');
    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('✅ Checkout session created:', session.id);

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMessage}` },
      { status: 500 }
    );
  }
}
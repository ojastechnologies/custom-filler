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

    // Validation
    console.log('🔍 Validating required fields:');
    console.log('- orderId:', !!orderId, orderId);
    console.log('- items:', !!items, `${items?.length || 0} items`);
    console.log('- successUrl:', !!successUrl);
    console.log('- cancelUrl:', !!cancelUrl);

    const missingFields: string[] = [];
    if (!orderId) missingFields.push('orderId');
    if (!items || items.length === 0) missingFields.push('items');
    if (!successUrl) missingFields.push('successUrl');
    if (!cancelUrl) missingFields.push('cancelUrl');

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('🛒 Creating checkout session for order:', orderId);
    console.log('📦 Items:', items.length);
    console.log('🎫 Applied deal:', appliedDeal?.deal?.code || 'None');

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
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: CartItem) => {
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

    // 🔥 FIX: Create minimal metadata to stay under 500 character limit
    const minimalCartItems = items.map(item => ({
      id: item.id,
      name: item.name.substring(0, 30), // Truncate long names
      price: item.price,
      qty: item.quantity
    }));

    // Create summary strings that fit in metadata limits
    const itemsSummary = minimalCartItems.map(item => 
      `${item.name}(${item.qty}x$${item.price})`
    ).join(',').substring(0, 450); // Keep under 500 chars

    const dealSummary = appliedDeal ? 
      `${appliedDeal.deal.code}:-$${appliedDeal.discountAmount}` : '';

    console.log('📋 Metadata summary lengths:');
    console.log('- Items summary:', itemsSummary.length, 'chars');
    console.log('- Deal summary:', dealSummary.length, 'chars');

    // Create checkout session with minimal metadata
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail || undefined,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      metadata: {
        // 🔥 ESSENTIAL: Only store the order ID - we can get everything else from our database
        orderId: orderId,
        itemCount: items.length.toString(),
        subtotal: subtotal.toString(),
        discountAmount: discountAmount.toString(),
        finalTotal: finalTotal.toString(),
        dealCode: appliedDeal?.deal?.code || '',
        customerEmail: customerEmail || '',
        // Optional: Store a short summary (if it fits)
        itemsSummary: itemsSummary.length < 400 ? itemsSummary : `${items.length} items`,
      },
    };

    console.log('🔄 Creating Stripe session with metadata:');
    Object.entries(sessionParams.metadata || {}).forEach(([key, value]) => {
      console.log(`- ${key}: ${value.length} chars`);
    });

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
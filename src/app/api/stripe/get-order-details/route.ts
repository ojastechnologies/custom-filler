import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil', 
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'No session ID provided' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer_details', 'shipping'], // Correct expansion
    });

    const orderDetails = {
      customer_name: session.customer_details?.name || 'Customer',
      customer_email: session.customer_details?.email || '',
      order_date: new Date(session.created * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      order_items: session.line_items?.data.map((item) => ({
        name: item.description,
        quantity: item.quantity || 1,
        price: (item.amount_total || 0) / 100,
      })) || [],
      total_amount: (session.amount_total || 0) / 100,
    //   shipping_address: session.shipping?.address
    //     ? `${session.shipping.address.line1 || ''}${
    //         session.shipping.address.line2 ? ` ${session.shipping.address.line2}` : ''
    //       }, ${session.shipping.address.city || ''}, ${session.shipping.address.state || ''} ${
    //         session.shipping.address.postal_code || ''
    //       }, ${session.shipping.address.country || ''}`.trim()
    //     : 'N/A',
    };

    return NextResponse.json(orderDetails);
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
  }
}
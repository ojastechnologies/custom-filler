import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching Stripe session:', sessionId);

    // Get the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'invoice']
    });

    console.log('✅ Session retrieved:', {
      id: session.id,
      payment_status: session.payment_status,
      invoice: session.invoice ? 'Present' : 'Not present'
    });

    let invoiceUrl = null;

    // Method 1: If session has an invoice (for subscription/invoice payments)
    if (session.invoice && typeof session.invoice === 'object') {
      invoiceUrl = session.invoice.hosted_invoice_url;
      console.log('📄 Invoice URL from session.invoice:', invoiceUrl);
    }
    
    // Method 2: If session has payment_intent, get the invoice from there
    else if (session.payment_intent && typeof session.payment_intent === 'object') {
      const paymentIntent = session.payment_intent;
      
      // Get charges from payment intent
      const charges = await stripe.charges.list({
        payment_intent: paymentIntent.id,
        limit: 1
      });

      if (charges.data.length > 0) {
        const charge = charges.data[0];
        
        // Get receipt URL (Stripe's built-in receipt)
        if (charge.receipt_url) {
          invoiceUrl = charge.receipt_url;
          console.log('🧾 Receipt URL from charge:', invoiceUrl);
        }
      }
    }

    // Method 3: Create a custom invoice if none exists
    if (!invoiceUrl) {
      console.log('📄 No existing invoice found, creating one...');
      
      try {
        // Get customer from session
        const customerId = session.customer;

        if (customerId && typeof customerId === 'string') {
          // Create an invoice
          const invoice = await stripe.invoices.create({
            customer: customerId,
            description: `Order from ${new Date().toLocaleDateString()}`,
            auto_advance: true,
          });

          // Add line items based on session line items
          const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
          
          for (const item of lineItems.data) {
            await stripe.invoiceItems.create({
              customer: customerId,
              invoice: invoice.id,
              description: item.description || undefined,
              quantity: item.quantity || undefined,
              price_data: {
                unit_amount: item.amount_total / (item.quantity || 1) || undefined,
                currency: session.currency || 'usd',
                product: 'prod_custom_invoice_item',
              },
            });
          }

          // Finalize and send the invoice
          if (invoice.id) {
            const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
            invoiceUrl = finalizedInvoice.hosted_invoice_url;
            
            console.log('✅ Created new invoice:', invoiceUrl);
          }
        }
      } catch (invoiceError) {
        console.error('❌ Error creating invoice:', invoiceError);
      }
    }

    if (!invoiceUrl) {
      return NextResponse.json(
        { error: 'Unable to generate invoice URL' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      invoiceUrl,
      sessionId,
      paymentStatus: session.payment_status
    });

  } catch (error) {
    console.error('❌ Error fetching invoice:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch invoice',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
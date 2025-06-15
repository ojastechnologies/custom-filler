import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('🧾 Fetching invoice for session:', sessionId);

    // Get the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['invoice', 'payment_intent']
    });

    console.log('📋 Session retrieved:', {
      id: session.id,
      payment_status: session.payment_status,
      invoice: session.invoice ? 'Present' : 'None',
      payment_intent: session.payment_intent ? 'Present' : 'None'
    });

    let invoiceData: any = {};

    // Try to get invoice from session
    if (session.invoice) {
      const invoice = session.invoice as Stripe.Invoice;
      console.log('📄 Invoice found from session:', invoice.id);
      
      invoiceData = {
        invoice_id: invoice.id,
        invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        status: invoice.status,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency
      };
    } 
    // If no invoice, try to get payment intent receipt
    else if (session.payment_intent) {
      const paymentIntent = session.payment_intent as Stripe.PaymentIntent;
      console.log('💳 Payment Intent found:', paymentIntent.id);

      // Get the latest charge from payment intent
      if (paymentIntent.latest_charge) {
        const charge = await stripe.charges.retrieve(
          paymentIntent.latest_charge as string
        );
        
        console.log('🧾 Charge found:', charge.id);
        
        invoiceData = {
          charge_id: charge.id,
          receipt_url: charge.receipt_url,
          invoice_url: charge.receipt_url, // Use receipt_url as invoice_url for consistency
          hosted_invoice_url: charge.receipt_url,
          amount: charge.amount,
          currency: charge.currency,
          status: charge.status,
          payment_method: charge.payment_method_details?.type
        };
      }
    }
    // Last resort: Create an invoice for the session
    else {
      console.log('📝 No invoice found, attempting to create one...');
      
      try {
        // Get customer from session
        let customerId = session.customer as string;
        
        // If no customer, create one
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: session.customer_details?.email || session.customer_email || undefined,
            name: session.customer_details?.name || undefined,
            phone: session.customer_details?.phone || undefined,
          });
          customerId = customer.id;
          console.log('👤 Created customer:', customerId);
        }

        // Create invoice items based on line items
        const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
        
        for (const item of lineItems.data) {
          await stripe.invoiceItems.create({
            customer: customerId,
            amount: item.amount_total,
            currency: session.currency || 'usd',
            description: item.description || undefined,
          });
        }

        // Create and finalize invoice
        const invoice = await stripe.invoices.create({
          customer: customerId,
          auto_advance: true,
          collection_method: 'charge_automatically',
        });

        if (invoice.id) {
          const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
          
          console.log('✅ Created invoice:', finalizedInvoice.id);
          
          invoiceData = {
            invoice_id: finalizedInvoice.id,
            invoice_url: finalizedInvoice.hosted_invoice_url,
            invoice_pdf: finalizedInvoice.invoice_pdf,
            hosted_invoice_url: finalizedInvoice.hosted_invoice_url,
            status: finalizedInvoice.status,
            amount_paid: finalizedInvoice.amount_paid,
            currency: finalizedInvoice.currency
          };
        }
        
      } catch (createError) {
        console.error('❌ Error creating invoice:', createError);
        // Fall back to basic session info
        invoiceData = {
          session_id: session.id,
          amount_total: session.amount_total,
          currency: session.currency,
          payment_status: session.payment_status,
          error: 'Could not create invoice, but payment was successful'
        };
      }
    }

    // If we still don't have any invoice URL, provide session details
    if (!invoiceData.invoice_url && !invoiceData.receipt_url && !invoiceData.hosted_invoice_url) {
      console.log('⚠️ No invoice URL available, providing session summary');
      invoiceData = {
        ...invoiceData,
        session_id: session.id,
        amount_total: session.amount_total,
        currency: session.currency,
        payment_status: session.payment_status,
        customer_email: session.customer_details?.email || session.customer_email,
        message: 'Payment successful - Invoice generation in progress'
      };
    }

    console.log('✅ Returning invoice data:', invoiceData);
    
    return NextResponse.json(invoiceData);

  } catch (error) {
    console.error('❌ Error fetching invoice:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to fetch invoice: ${errorMessage}` },
      { status: 500 }
    );
  }
}
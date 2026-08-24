import { NextRequest, NextResponse } from 'next/server';
import { azureEmailService } from '@/services/azureEmailService';
import { notifyOrder, resolveOrderByNumber } from '@/lib/orderNotifications';
import { OrderConfirmationData } from '@/types/email';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

/**
 * Order confirmation emails.
 *
 * When the posted order number matches an order in the database, delivery is
 * delegated to notifyOrder(): idempotent (DB-claimed notification slots),
 * built from authoritative DB data, shared with the Stripe webhook. Only
 * payloads that don't correspond to a stored order (e.g. manual tests) fall
 * back to a direct send.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📧 Email API: Starting email send process...');

    const body = await request.json();
    const { orderData, sendToAdmin = true } = body;

    console.log('📧 Email API: Received request with data:', {
      hasOrderData: !!orderData,
      orderNumber: orderData?.orderNumber,
      customerEmail: orderData?.customerEmail,
      sendToAdmin,
    });

    if (!orderData) {
      console.error('❌ Email API: No order data provided');
      return NextResponse.json(
        { success: false, error: 'Order data is required', errors: ['Order data is required'] },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['orderNumber', 'customerName', 'customerEmail', 'orderItems', 'totalAmount'];
    const missingFields = requiredFields.filter(field =>
      orderData[field] === undefined || orderData[field] === null
    );

    if (missingFields.length > 0) {
      console.error('❌ Email API: Missing required fields:', missingFields);
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          errors: [`Missing required fields: ${missingFields.join(', ')}`],
          missingFields,
        },
        { status: 400 }
      );
    }

    // Validate order items
    if (!Array.isArray(orderData.orderItems) || orderData.orderItems.length === 0) {
      console.error('❌ Email API: Invalid order items:', orderData.orderItems);
      return NextResponse.json(
        {
          success: false,
          error: 'Order must contain at least one item',
          errors: ['Order must contain at least one item'],
        },
        { status: 400 }
      );
    }

    // ─── Preferred path: stored order → idempotent server-side pipeline ───
    const storedOrder = await resolveOrderByNumber(String(orderData.orderNumber));

    if (storedOrder) {
      console.log(`📧 Email API: order ${orderData.orderNumber} found in DB (${storedOrder.id}); using idempotent notification pipeline`);

      const result = await notifyOrder(storedOrder.id, { sendToAdmin });

      if (!result) {
        return NextResponse.json(
          {
            success: false,
            error: `Order ${storedOrder.id} could not be loaded`,
            errors: [`Order ${storedOrder.id} could not be loaded`],
          },
          { status: 500 }
        );
      }

      const sentCount = result.results.filter(r => r.sent).length;
      const failures = result.results.filter(r => r.attempted && !r.sent);
      const errors = failures.map(f => `${f.target} email error: ${f.error}`);
      const notes = result.results
        .filter(r => !r.attempted && r.skippedReason && r.skippedReason !== 'already-notified')
        .map(r => `${r.target} email skipped (${r.skippedReason})`);

      const responseData = {
        success: result.allSucceeded,
        results: result.results.map(r => {
          if (r.sent && r.skippedReason === 'already-notified') {
            return `${r.target === 'customer' ? 'Customer' : 'Admin'} email was already sent`;
          }
          if (r.skippedReason) {
            return `${r.target === 'customer' ? 'Customer' : 'Admin'} email skipped (${r.skippedReason})`;
          }
          return `${r.target === 'customer' ? 'Customer' : 'Admin'} email sent successfully`;
        }),
        errors,
        message: failures.length === 0
          ? `Notifications processed (${sentCount}/${result.results.length} delivered)`
          : `Partial failure: ${failures.length} of ${result.results.length} emails failed`,
        details: {
          customerEmailAttempted: true,
          adminEmailAttempted: sendToAdmin,
          totalAttempted: result.results.length,
          totalSucceeded: sentCount,
          totalFailed: failures.length,
          skipped: notes,
        },
      };

      console.log('📧 Email API: idempotent pipeline result:', responseData.message);
      return NextResponse.json(responseData);
    }

    // ─── Fallback: no matching order row → direct send of the posted payload ───
    console.log('📧 Email API: no stored order matched; sending posted payload directly');

    const processedOrderData: OrderConfirmationData = {
      orderNumber: String(orderData.orderNumber),
      customerName: String(orderData.customerName),
      customerEmail: String(orderData.customerEmail),
      customerPhone: orderData.customerPhone ? String(orderData.customerPhone) : '',
      orderItems: orderData.orderItems.map((item: OrderItem) => {
        let calculatedPrice = Number(item.price) || 0;
        if ((calculatedPrice === 0 || !calculatedPrice) && item.total && item.quantity && item.quantity > 0) {
          calculatedPrice = item.total / item.quantity;
        }

        let name = String(item.name || '').trim();
        if (!name) {
          name = 'Laser Cryogen';
        }

        return {
          name,
          quantity: Number(item.quantity) || 1,
          price: calculatedPrice,
          total: Number(item.total) || 0,
        };
      }),
      subtotal: Number(orderData.subtotal) || 0,
      discountAmount: Number(orderData.discountAmount) || 0,
      shippingCost: Number(orderData.shippingCost) || 0,
      taxAmount: Number(orderData.taxAmount) || 0,
      totalAmount: Number(orderData.totalAmount) || 0,
      currency: orderData.currency || 'USD',
      paymentStatus: orderData.paymentStatus || 'paid',
      orderDate: orderData.orderDate || new Date().toISOString(),
      shippingAddress: {
        line1: String(orderData.shippingAddress?.line1 || ''),
        line2: orderData.shippingAddress?.line2 ? String(orderData.shippingAddress.line2) : undefined,
        city: String(orderData.shippingAddress?.city || ''),
        state: String(orderData.shippingAddress?.state || ''),
        postalCode: String(orderData.shippingAddress?.postalCode || ''),
        country: String(orderData.shippingAddress?.country || 'US'),
      },
      dealCode: orderData.dealCode ? String(orderData.dealCode) : undefined,
    };

    const results: string[] = [];
    const errors: string[] = [];

    try {
      const customerResult = await azureEmailService.sendOrderConfirmation(processedOrderData);
      if (customerResult) {
        results.push('Customer confirmation email sent successfully');
      } else {
        errors.push('Customer confirmation email failed to send');
      }
    } catch (error) {
      errors.push(`Customer email error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    if (sendToAdmin) {
      try {
        const adminResult = await azureEmailService.sendAdminNotification(processedOrderData);
        if (adminResult) {
          results.push('Admin notification email sent successfully');
        } else {
          errors.push('Admin notification email failed to send');
        }
      } catch (error) {
        errors.push(`Admin email error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    const success = results.length > 0 && errors.length === 0;
    const responseData = {
      success,
      results,
      errors,
      message: success
        ? `All emails sent successfully (${results.length} sent)`
        : results.length > 0
          ? `Partial success: ${results.length} sent, ${errors.length} failed`
          : `All emails failed (${errors.length} errors)`,
      details: {
        customerEmailAttempted: true,
        adminEmailAttempted: sendToAdmin,
        totalAttempted: sendToAdmin ? 2 : 1,
        totalSucceeded: results.length,
        totalFailed: errors.length,
      },
    };

    return NextResponse.json(responseData);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    console.error('❌ Email API: Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        errors: [errorMessage],
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

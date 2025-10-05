import { NextRequest, NextResponse } from 'next/server';
import { azureEmailService } from '@/services/azureEmailService';
import { OrderConfirmationData } from '@/types/email';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

// Simple in-memory cache to prevent duplicate emails (will reset with server restart)
const emailSendCache = new Map<string, { timestamp: number; orderNumber: string }>();

// Prevent duplicate emails within 30 seconds for the same order
function isDuplicateRequest(orderNumber: string, customerEmail: string): boolean {
  const cacheKey = `order_${orderNumber}_${customerEmail}`;
  const cached = emailSendCache.get(cacheKey);
  const now = Date.now();
  
  // If we've seen this exact request in the last 30 seconds, it's a duplicate
  if (cached && (now - cached.timestamp < 30000)) {
    console.log('📧 Email API: Duplicate request detected, skipping', { cacheKey, cached, now });
    return true;
  }
  
  // Clear old entries (older than 5 minutes)
  for (const [key, value] of emailSendCache.entries()) {
    if (now - value.timestamp > 300000) { // 5 minutes
      emailSendCache.delete(key);
    }
  }
  
  // Add this request to cache
  emailSendCache.set(cacheKey, { timestamp: now, orderNumber });
  return false;
}

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
      bodyKeys: Object.keys(body)
    });
    
    // Check for duplicate requests
    if (orderData?.orderNumber && orderData?.customerEmail) {
      if (isDuplicateRequest(orderData.orderNumber, orderData.customerEmail)) {
        console.log('📧 Email API: Duplicate request blocked for order', orderData.orderNumber);
        return NextResponse.json({
          success: true,
          message: 'Duplicate request detected - emails already sent',
          results: ['Duplicate request - no action taken'],
          errors: [],
          details: { duplicate: true }
        });
      }
    }

    if (!orderData) {
      console.error('❌ Email API: No order data provided');
      return NextResponse.json(
        { success: false, error: 'Order data is required', errors: ['Order data is required'] },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['orderNumber', 'customerName', 'customerEmail', 'orderItems', 'totalAmount'];
    const missingFields = requiredFields.filter(field => {
      const hasField = orderData[field] !== undefined && orderData[field] !== null;
      if (!hasField) {
        console.log(`❌ Email API: Missing field '${field}':`, orderData[field]);
      }
      return !hasField;
    });
    
    if (missingFields.length > 0) {
      console.error('❌ Email API: Missing required fields:', missingFields);
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          errors: [`Missing required fields: ${missingFields.join(', ')}`],
          missingFields 
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
          errors: ['Order must contain at least one item']
        },
        { status: 400 }
      );
    }

    // Ensure numeric fields have default values and are properly converted
    const processedOrderData: OrderConfirmationData = {
      orderNumber: String(orderData.orderNumber),
      customerName: String(orderData.customerName),
      customerEmail: String(orderData.customerEmail),
      customerPhone: orderData.customerPhone ? String(orderData.customerPhone) : '',
      orderItems: orderData.orderItems.map((item: OrderItem) => {
        // Calculate unit price dynamically if not available or if it's zero but total is available
        let calculatedPrice = Number(item.price) || 0;
        if ((calculatedPrice === 0 || !calculatedPrice) && item.total && item.quantity && item.quantity > 0) {
          calculatedPrice = item.total / item.quantity;
        }
        
        const processedItem = {
          name: String(item.name || 'Unknown Product'),  // Default to avoid empty names
          quantity: Number(item.quantity) || 1,
          price: calculatedPrice,
          total: Number(item.total) || 0,
        };
        
        // Log any problematic items for debugging
        if (processedItem.price === 0 && processedItem.total > 0) {
          console.warn('⚠️ Price is 0 but total is greater than 0 - calculating from total/quantity:', {
            originalPrice: item.price,
            total: processedItem.total,
            quantity: processedItem.quantity,
            calculatedPrice: calculatedPrice,
            name: processedItem.name
          });
        }
        
        if (!processedItem.name || processedItem.name.trim() === '') {
          processedItem.name = 'Laser Cryogen'; // Use Laser Cryogen as fallback
          console.warn('⚠️ Item name is empty - using default name:', {
            originalName: item.name,
            quantity: processedItem.quantity,
            price: processedItem.price,
            total: processedItem.total
          });
        }
        
        return processedItem;
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
        line2: orderData.shippingAddress?.line2 ? String(orderData.shippingAddress.line2) : '',
        city: String(orderData.shippingAddress?.city || ''),
        state: String(orderData.shippingAddress?.state || ''),
        postalCode: String(orderData.shippingAddress?.postalCode || ''),
        country: String(orderData.shippingAddress?.country || 'US'),
      },
      dealCode: orderData.dealCode ? String(orderData.dealCode) : undefined,
    };

    console.log('📧 Email API: Processed order data:', {
      orderNumber: processedOrderData.orderNumber,
      customerEmail: processedOrderData.customerEmail,
      customerName: processedOrderData.customerName,
      totalAmount: processedOrderData.totalAmount,
      itemCount: processedOrderData.orderItems.length,
      shippingAddress: processedOrderData.shippingAddress.line1 ? 'Present' : 'Missing',
      // Additional logging for debugging item issues
      problematicItems: processedOrderData.orderItems.filter(item => 
        item.price === 0 && item.total > 0 || !item.name || item.name.trim() === ''
      ).map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }))
    });

    const results: string[] = [];
    const errors: string[] = [];

    // Send customer confirmation email
    try {
      console.log('📧 Email API: Attempting to send customer confirmation email...');
      const customerResult = await azureEmailService.sendOrderConfirmation(processedOrderData);
      
      if (customerResult) {
        console.log('✅ Email API: Customer email sent successfully');
        results.push('Customer confirmation email sent successfully');
      } else {
        console.error('❌ Email API: Customer email failed - service returned false');
        errors.push('Customer confirmation email failed to send');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in customer email';
      console.error('❌ Email API: Error sending customer email:', error);
      errors.push(`Customer email error: ${errorMessage}`);
    }

    // Send admin notification email if requested
    if (sendToAdmin) {
      try {
        console.log('📧 Email API: Attempting to send admin notification email...');
        const adminResult = await azureEmailService.sendAdminNotification(processedOrderData);
        
        if (adminResult) {
          console.log('✅ Email API: Admin email sent successfully');
          results.push('Admin notification email sent successfully');
        } else {
          console.error('❌ Email API: Admin email failed - service returned false');
          errors.push('Admin notification email failed to send');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error in admin email';
        console.error('❌ Email API: Error sending admin email:', error);
        errors.push(`Admin email error: ${errorMessage}`);
      }
    }

    // Determine overall success
    const success = results.length > 0 && errors.length === 0;
    const hasPartialSuccess = results.length > 0 && errors.length > 0;

    const responseMessage = success 
      ? `All emails sent successfully (${results.length} sent)`
      : hasPartialSuccess
      ? `Partial success: ${results.length} sent, ${errors.length} failed`
      : `All emails failed (${errors.length} errors)`;

    console.log('📧 Email API: Final results:', { 
      success, 
      hasPartialSuccess,
      resultsCount: results.length,
      errorsCount: errors.length,
      results, 
      errors,
      message: responseMessage
    });

    const responseData = {
      success,
      results,
      errors,
      message: responseMessage,
      details: {
        customerEmailAttempted: true,
        adminEmailAttempted: sendToAdmin,
        totalAttempted: sendToAdmin ? 2 : 1,
        totalSucceeded: results.length,
        totalFailed: errors.length
      }
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
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
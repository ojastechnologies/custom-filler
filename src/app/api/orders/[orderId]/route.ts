import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    
    console.log('🔍 Fetching order:', orderId);

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch the order with its items
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          unit_price,
          quantity,
          product_image,
          total_price,
          product_discount_amount,
          stripe_product_id,
          stripe_price_id
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('❌ Error fetching order:', error);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('✅ Order found:', order.order_number);

    // Format the response
    const formattedOrder = {
      ...order,
      items: order.order_items || []
    };

    // Remove the nested order_items to avoid duplication
    delete formattedOrder.order_items;

    return NextResponse.json({
      success: true,
      order: formattedOrder
    });

  } catch (error: unknown) {
    console.error('❌ API Error fetching order:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch order',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
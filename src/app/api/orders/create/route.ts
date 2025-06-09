import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Creating new order...');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const {
      customer_email,
      customer_name,
      customer_phone,
      shipping_line1,
      shipping_line2,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
      subtotal,
      shipping_cost = 0,
      tax_amount = 0,
      total_amount,
      currency = 'usd',
      status = 'pending',
      items
    } = body;

    // Validate required fields
    if (!customer_email || !customer_name || !total_amount || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_email, customer_name, total_amount, and items are required' },
        { status: 400 }
      );
    }

    // Create order data
    const orderData = {
      stripe_session_id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Temporary ID until Stripe payment
      customer_email,
      customer_name,
      customer_phone,
      shipping_line1,
      shipping_line2,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
      subtotal: parseFloat(subtotal),
      shipping_cost: parseFloat(shipping_cost),
      tax_amount: parseFloat(tax_amount),
      total_amount: parseFloat(total_amount),
      currency,
      status
    };

    console.log('💾 Inserting order:', orderData);

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order', details: orderError.message },
        { status: 500 }
      );
    }

    console.log('✅ Order created with ID:', order.id);

    // Insert order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_description: item.product_description,
      product_image: item.product_image,
      quantity: parseInt(item.quantity),
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat(item.total_price)
    }));

    console.log('📦 Inserting order items:', orderItems);

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('❌ Error creating order items:', itemsError);
      // Try to clean up the order if items failed
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: 'Failed to create order items', details: itemsError.message },
        { status: 500 }
      );
    }

    console.log('✅ Order items created successfully');

    // Fetch the complete order with items
    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', order.id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching complete order:', fetchError);
      return NextResponse.json(
        { error: 'Order created but failed to fetch complete data' },
        { status: 500 }
      );
    }

    console.log('🎉 Order creation completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: completeOrder
    });

  } catch (error) {
    console.error('❌ Order creation failed:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
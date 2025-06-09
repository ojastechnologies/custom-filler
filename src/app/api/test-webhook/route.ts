import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test orders table
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (ordersError) {
      console.error('❌ Orders table error:', ordersError);
      return NextResponse.json({ 
        error: 'Orders table not accessible', 
        details: ordersError,
        suggestion: 'Make sure the orders table exists in Supabase'
      }, { status: 500 });
    }

    // Test order_items table
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .limit(1);

    if (itemsError) {
      console.error('❌ Order items table error:', itemsError);
      return NextResponse.json({ 
        error: 'Order items table not accessible', 
        details: itemsError,
        suggestion: 'Make sure the order_items table exists in Supabase'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Database tables are accessible',
      orders_count: ordersData?.length || 0,
      items_count: itemsData?.length || 0,
      webhook_secret_configured: !!process.env.STRIPE_WEBHOOK_SECRET
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Test creating a sample order
    const sampleOrder = {
      stripe_session_id: `test_${Date.now()}`,
      customer_email: 'test@example.com',
      customer_name: 'Test Customer',
      subtotal: 10.00,
      total_amount: 10.00,
      currency: 'usd',
      status: 'pending'
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([sampleOrder])
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ 
        error: 'Failed to create test order', 
        details: orderError 
      }, { status: 500 });
    }

    // Clean up test order
    await supabase.from('orders').delete().eq('id', order.id);

    return NextResponse.json({ 
      success: true,
      message: 'Test order creation successful',
      test_order_id: order.id
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Test order creation failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
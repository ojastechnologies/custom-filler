import { supabase } from '@/lib/supabaseClient';

export interface Order {
  id: string;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  
  // Shipping Address
  shipping_line1?: string;
  shipping_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  
  // Order Details
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  
  // Order Status
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  
  // Timestamps
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  delivered_at?: string;
  
  // Related data
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_description?: string;
  product_image?: string;
  product_clientpathurl?: string; // Added this field
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface CreateOrderData {
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  shipping_line1?: string;
  shipping_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  items: {
    product_id: string;
    product_name: string;
    product_description?: string;
    product_image?: string;
    product_clientpathurl?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

// Create order in database with all fields
export const createOrderInDatabase = async (orderData: CreateOrderData): Promise<Order> => {
  try {
    console.log('🚀 Creating order in database with data:', orderData);

    // First, create the order
    const { data: orderResult, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_email: orderData.customer_email,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          shipping_line1: orderData.shipping_line1,
          shipping_line2: orderData.shipping_line2,
          shipping_city: orderData.shipping_city,
          shipping_state: orderData.shipping_state,
          shipping_postal_code: orderData.shipping_postal_code,
          shipping_country: orderData.shipping_country,
          subtotal: orderData.subtotal,
          shipping_cost: orderData.shipping_cost,
          tax_amount: orderData.tax_amount,
          total_amount: orderData.total_amount,
          currency: orderData.currency,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    console.log('✅ Order created successfully:', orderResult);

    // Now create the order items with ALL fields
    const orderItems = orderData.items.map(item => ({
      order_id: orderResult.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_description: item.product_description,
      product_image: item.product_image,
      product_clientpathurl: item.product_clientpathurl, // Include this field
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    }));

    console.log('📝 Creating order items with ALL fields:', orderItems);

    const { data: itemsResult, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) {
      console.error('❌ Error creating order items:', itemsError);
      // If items creation fails, we should probably delete the order too
      await supabase.from('orders').delete().eq('id', orderResult.id);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    console.log('✅ Order items created successfully:', itemsResult);

    return {
      ...orderResult,
      order_items: itemsResult
    };

  } catch (error) {
    console.error('❌ Error in createOrderInDatabase:', error);
    throw error;
  }
};

export interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
}

export const fetchOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchOrders:', error);
    throw error;
  }
};

export const fetchOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchOrderById:', error);
    throw error;
  }
};

export const updateOrderStatus = async (
  orderId: string, 
  status: Order['status']
): Promise<Order> => {
  try {
    const updateData: any = { status };
    
    // Set timestamps based on status
    if (status === 'shipped') {
      updateData.shipped_at = new Date().toISOString();
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select(`
        *,
        order_items (*)
      `)
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    throw error;
  }
};

export const getOrderStats = async (): Promise<OrderStats> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('status, total_amount');

    if (error) {
      console.error('Error fetching order stats:', error);
      throw error;
    }

    const stats: OrderStats = {
      total_orders: data.length,
      total_revenue: data.reduce((sum, order) => sum + order.total_amount, 0),
      pending_orders: data.filter(order => order.status === 'pending').length,
      processing_orders: data.filter(order => order.status === 'processing').length,
      shipped_orders: data.filter(order => order.status === 'shipped').length,
      delivered_orders: data.filter(order => order.status === 'delivered').length,
      cancelled_orders: data.filter(order => order.status === 'cancelled').length,
    };

    return stats;
  } catch (error) {
    console.error('Error in getOrderStats:', error);
    throw error;
  }
};
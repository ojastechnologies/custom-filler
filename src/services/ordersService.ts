import { supabase } from '@/lib/supabaseClient';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_description?: string;
  product_image?: string;
  product_clientpathurl?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  
  // Shipping address
  shipping_line1?: string;
  shipping_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  
  // Order totals
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total_amount: number;
  currency: string;

  /** What Stripe last reported for this order's checkout session. */
  payment_status?: string | null;
  
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  
  // Related data
  order_items?: OrderItem[];
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

  /** What Stripe last reported for this order's checkout session. */
  payment_status?: string | null;
  deal_id?: string;
  deal_code?: string;
  discount_amount?: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    description?: string;
    clientpathurl?: string;
  }>;
}

// Create order in database with all fields
export const createOrderInDatabase = async (orderData: CreateOrderData): Promise<Order> => {
  try {
    console.log('🚀 Creating order in database with data:', orderData);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // First, create the order
    const { data: orderResult, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          order_number: orderNumber,
          customer_email: orderData.customer_email,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          shipping_line1: orderData.shipping_line1,
          shipping_line2: orderData.shipping_line2,
          shipping_city: orderData.shipping_city,
          shipping_state: orderData.shipping_state,
          shipping_postal_code: orderData.shipping_postal_code,
          shipping_country: orderData.shipping_country || 'US',
          subtotal: orderData.subtotal,
          shipping_cost: orderData.shipping_cost,
          tax_amount: orderData.tax_amount,
          total_amount: orderData.total_amount,
          currency: orderData.currency,
          deal_id: orderData.deal_id,
          deal_code: orderData.deal_code,
          discount_amount: orderData.discount_amount || 0,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    if (!orderResult) {
      throw new Error('No order data returned from database');
    }

    console.log('✅ Order created successfully:', orderResult.order_number);

    // Create order items
    if (orderData.items && orderData.items.length > 0) {
      const orderItems = orderData.items.map(item => ({
        order_id: orderResult.id,
        product_id: item.id,
        product_name: item.name,
        product_description: item.description || null,
        product_image: item.image || null,
        product_clientpathurl: item.clientpathurl || null,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      console.log('📦 Creating order items:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ Error creating order items:', itemsError);
        // Try to delete the order if items creation failed
        await supabase.from('orders').delete().eq('id', orderResult.id);
        throw new Error(`Failed to create order items: ${itemsError.message}`);
      }

      console.log('✅ Order items created successfully');
    }

    // Handle deal usage if applicable
    if (orderData.deal_id) {
      try {
        console.log('📈 Incrementing deal usage for deal:', orderData.deal_id);
        
        const { error: dealError } = await supabase.rpc('increment_deal_usage', {
          deal_id: orderData.deal_id
        });

        if (dealError) {
          console.error('❌ Error incrementing deal usage:', dealError);
        } else {
          console.log('✅ Deal usage incremented successfully');
        }

        // Record deal usage
        await supabase
          .from('deal_usage')
          .insert([
            {
              deal_id: orderData.deal_id,
              customer_email: orderData.customer_email,
              discount_amount: orderData.discount_amount || 0,
              order_id: orderResult.id
            }
          ]);

        console.log('✅ Deal usage recorded');
      } catch (dealError) {
        console.error('❌ Error handling deal usage:', dealError);
        // Don't fail the order creation for deal errors
      }
    }

    return orderResult as Order;

  } catch (error) {
    console.error('❌ Error in createOrderInDatabase:', error);
    throw error;
  }
};

// Update order with Stripe information after payment
export const updateOrderWithStripeInfo = async (
  orderId: string, 
  stripeSessionId: string, 
  stripePaymentIntentId?: string
): Promise<void> => {
  try {
    console.log('🔄 Updating order with Stripe info:', { orderId, stripeSessionId });

    const { error } = await supabase
      .from('orders')
      .update({
        stripe_session_id: stripeSessionId,
        stripe_payment_intent_id: stripePaymentIntentId,
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      console.error('❌ Error updating order with Stripe info:', error);
      throw error;
    }

    console.log('✅ Order updated with Stripe info successfully');
  } catch (error) {
    console.error('❌ Error in updateOrderWithStripeInfo:', error);
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
    console.log('🔍 Fetching orders from database...');
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_name,
          product_description,
          product_image,
          product_clientpathurl,
          quantity,
          unit_price,
          total_price
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ Error fetching orders:', error);
      throw error;
    }
    
    console.log('✅ Orders fetched successfully:', data?.length || 0);
    return data || [];
  } catch (err) {
    console.error('❌ Error in fetchOrders:', err);
    throw err;
  }
};

export const fetchOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    console.log('🔍 Fetching order by ID:', orderId);
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_description,
          product_image,
          product_clientpathurl,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('❌ Error fetching order:', error);
      throw error;
    }
    
    console.log('✅ Order fetched successfully:', data?.order_number);
    return data;
  } catch (err) {
    console.error('❌ Error in fetchOrderById:', err);
    throw err;
  }
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<void> => {
  try {
    console.log('🔄 Updating order status:', { orderId, status });

    const { error } = await supabase
      .from('orders')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      console.error('❌ Error updating order status:', error);
      throw error;
    }

    console.log('✅ Order status updated successfully');
  } catch (error) {
    console.error('❌ Error in updateOrderStatus:', error);
    throw error;
  }
};

export const createOrder = async (orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>): Promise<Order> => {
  try {
    console.log('🆕 Creating order:', orderData);
    
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
    
    console.log('✅ Order created successfully:', data.order_number);
    return data;
  } catch (err) {
    console.error('❌ Error in createOrder:', err);
    throw err;
  }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting order:', orderId);
    
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('❌ Error deleting order:', error);
      throw error;
    }
    
    console.log('✅ Order deleted successfully');
  } catch (err) {
    console.error('❌ Error in deleteOrder:', err);
    throw err;
  }
};

export const fetchOrdersByCustomerEmail = async (email: string): Promise<Order[]> => {
  try {
    console.log('🔍 Fetching orders for customer:', email);
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_description,
          product_image,
          product_clientpathurl,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('customer_email', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching customer orders:', error);
      throw error;
    }
    
    console.log('✅ Customer orders fetched successfully:', data?.length || 0);
    return data || [];
  } catch (err) {
    console.error('❌ Error in fetchOrdersByCustomerEmail:', err);
    throw err;
  }
};

export const getOrderStats = async () => {
  try {
    console.log('📊 Fetching order statistics...');
    
    // Get total orders count
    const { count: totalOrders, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Get orders by status
    const { data: statusData, error: statusError } = await supabase
      .from('orders')
      .select('status')
      .order('status');

    if (statusError) throw statusError;

    // Get total revenue
    const { data: revenueData, error: revenueError } = await supabase
      .from('orders')
      .select('total_amount')
      .neq('status', 'cancelled');

    if (revenueError) throw revenueError;

    const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

    // Count orders by status
    const statusCounts = statusData?.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    console.log('✅ Order statistics fetched successfully');
    
    return {
      totalOrders: totalOrders || 0,
      totalRevenue,
      statusCounts,
    };
  } catch (err) {
    console.error('❌ Error in getOrderStats:', err);
    throw err;
  }
};
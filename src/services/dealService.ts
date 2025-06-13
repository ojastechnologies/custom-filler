import { supabase } from '@/lib/supabaseClient';

export interface Deal {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DealValidationResult {
  isValid: boolean;
  message: string;
  deal?: Deal;
  discountAmount?: number;
  error?: string;
}

 
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
  clientpathurl?: string;
}


export const fetchDeals = async (): Promise<Deal[]> => {
  try {
    console.log('🔍 Fetching deals...');
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching deals:', error);
      throw error;
    }
    
    console.log('✅ Deals fetched successfully:', data?.length || 0);
    return data || [];
  } catch (err) {
    console.error('❌ Error in fetchDeals:', err);
    throw err;
  }
};

export const createDeal = async (dealData: Omit<Deal, 'id' | 'usage_count' | 'created_at' | 'updated_at'>): Promise<Deal> => {
  try {
    console.log('🆕 Creating deal:', dealData);
    
    // Prepare the data for insertion
    const insertData = {
      code: dealData.code.toUpperCase().trim(),
      description: dealData.description.trim(),
      discount_type: dealData.discount_type,
      discount_value: Number(dealData.discount_value),
      minimum_order_amount: dealData.minimum_order_amount ? Number(dealData.minimum_order_amount) : null,
      maximum_discount_amount: dealData.maximum_discount_amount ? Number(dealData.maximum_discount_amount) : null,
      usage_limit: dealData.usage_limit ? Number(dealData.usage_limit) : null,
      expires_at: dealData.expires_at || null,
      is_active: dealData.is_active,
      usage_count: 0
    };

    console.log('📝 Insert data prepared:', insertData);

    const { data, error } = await supabase
      .from('deals')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error creating deal:', error);
      throw new Error(`Failed to create deal: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from deal creation');
    }

    console.log('✅ Deal created successfully:', data);
    return data;
  } catch (err) {
    console.error('❌ Error in createDeal:', err);
    throw err;
  }
};

export const updateDeal = async (id: string, updates: Partial<Omit<Deal, 'id' | 'created_at' | 'updated_at'>>): Promise<Deal> => {
  try {
    console.log('📝 Updating deal:', id, updates);
    
    // Prepare the update data
    const updateData:  Partial<{
      code: string;
      description: string;
      discount_type: 'percentage' | 'fixed_amount';
      discount_value: number;
      minimum_order_amount: number | null;
      maximum_discount_amount: number | null;
      usage_limit: number | null;
      expires_at: string | null;
      is_active: boolean;
      usage_count: number;
    }> = {};
    
    if (updates.code !== undefined) updateData.code = updates.code.toUpperCase().trim();
    if (updates.description !== undefined) updateData.description = updates.description.trim();
    if (updates.discount_type !== undefined) updateData.discount_type = updates.discount_type;
    if (updates.discount_value !== undefined) updateData.discount_value = Number(updates.discount_value);
    if (updates.minimum_order_amount !== undefined) {
      updateData.minimum_order_amount = updates.minimum_order_amount ? Number(updates.minimum_order_amount) : null;
    }
    if (updates.maximum_discount_amount !== undefined) {
      updateData.maximum_discount_amount = updates.maximum_discount_amount ? Number(updates.maximum_discount_amount) : null;
    }
    if (updates.usage_limit !== undefined) {
      updateData.usage_limit = updates.usage_limit ? Number(updates.usage_limit) : null;
    }
    if (updates.expires_at !== undefined) updateData.expires_at = updates.expires_at || null;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    if (updates.usage_count !== undefined) updateData.usage_count = Number(updates.usage_count);

    const { data, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating deal:', error);
      throw new Error(`Failed to update deal: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from deal update');
    }

    console.log('✅ Deal updated successfully:', data);
    return data;
  } catch (err) {
    console.error('❌ Error in updateDeal:', err);
    throw err;
  }
};

export const deleteDeal = async (id: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting deal:', id);
    
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting deal:', error);
      throw new Error(`Failed to delete deal: ${error.message}`);
    }

    console.log('✅ Deal deleted successfully');
  } catch (err) {
    console.error('❌ Error in deleteDeal:', err);
    throw err;
  }
};

export const validateDealCode = async (code: string, cartItems: CartItem[]): Promise<DealValidationResult> => {
  try {
    console.log('🔍 Validating deal code:', code);
    console.log('🛒 Cart items for validation:', cartItems);
    
    // Fetch the deal by code
    const { data: deal, error } = await supabase
      .from('deals')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (error || !deal) {
      console.log('❌ Deal not found:', error?.message);
      return {
        isValid: false,
        message: 'Invalid deal code'
      };
    }

    console.log('🔍 Found deal:', deal);

    // Check if deal is active
    if (!deal.is_active) {
      return {
        isValid: false,
        message: 'This deal is no longer active'
      };
    }

    // Check if deal has expired
    if (deal.expires_at && new Date(deal.expires_at) < new Date()) {
      return {
        isValid: false,
        message: 'This deal has expired'
      };
    }

    // Check usage limit
    if (deal.usage_limit && deal.usage_count >= deal.usage_limit) {
      return {
        isValid: false,
        message: 'This deal has reached its usage limit'
      };
    }

    // Calculate cart total
    const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    console.log('💰 Cart total for deal validation:', cartTotal);

    // Check minimum order amount
    if (deal.minimum_order_amount && cartTotal < deal.minimum_order_amount) {
      return {
        isValid: false,
        message: `Minimum order amount of $${deal.minimum_order_amount.toFixed(2)} required`
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (deal.discount_type === 'percentage') {
      discountAmount = cartTotal * (deal.discount_value / 100);
    } else {
      discountAmount = deal.discount_value;
    }

    // Apply maximum discount limit if set
    if (deal.maximum_discount_amount && discountAmount > deal.maximum_discount_amount) {
      discountAmount = deal.maximum_discount_amount;
    }

    // 🔥 IMPORTANT: Ensure discount doesn't exceed cart total (leave at least $0.50)
    const maxAllowedDiscount = Math.max(0, cartTotal - 0.50);
    discountAmount = Math.min(discountAmount, maxAllowedDiscount);

    // Ensure discount is not negative
    discountAmount = Math.max(0, discountAmount);

    console.log('✅ Deal validation successful:', { 
      cartTotal, 
      discountAmount, 
      finalTotal: cartTotal - discountAmount 
    });

    // Check if discount results in a meaningful savings
    if (discountAmount < 0.01) {
      return {
        isValid: false,
        message: 'This deal does not provide any discount for your current cart'
      };
    }

    return {
      isValid: true,
      message: `Deal applied successfully! You save $${discountAmount.toFixed(2)}`,
      deal,
      discountAmount
    };

  } catch (err) {
    console.error('❌ Error validating deal code:', err);
    return {
      isValid: false,
      message: 'Error validating deal code. Please try again.'
    };
  }
};

export const incrementDealUsage = async (dealId: string): Promise<void> => {
  try {
    console.log('📈 Incrementing deal usage:', dealId);
    
    const { error } = await supabase.rpc('increment_deal_usage', {
      deal_id: dealId
    });

    if (error) {
      console.error('❌ Error incrementing deal usage:', error);
      throw error;
    }

    console.log('✅ Deal usage incremented successfully');
  } catch (err) {
    console.error('❌ Error in incrementDealUsage:', err);
    throw err;
  }
};
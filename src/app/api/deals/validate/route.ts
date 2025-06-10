import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Deal {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y';
  percentage_off?: number;
  fixed_amount_off?: number;
  buy_quantity?: number;
  get_quantity?: number;
  minimum_order_amount: number;
  maximum_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  per_customer_limit: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { code, items, customerEmail } = await request.json();

    if (!code || !items || !Array.isArray(items)) {
      return NextResponse.json({
        isValid: false,
        message: 'Invalid request data'
      }, { status: 400 });
    }

    // Fetch deal from database
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({
        isValid: false,
        message: 'Invalid deal code'
      });
    }

    // Check if deal is expired
    const now = new Date();
    const startDate = new Date(deal.start_date);
    const endDate = deal.end_date ? new Date(deal.end_date) : null;

    if (now < startDate) {
      return NextResponse.json({
        isValid: false,
        message: 'This deal is not yet active'
      });
    }

    if (endDate && now > endDate) {
      return NextResponse.json({
        isValid: false,
        message: 'This deal has expired'
      });
    }

    // Check usage limits
    if (deal.usage_limit && deal.usage_count >= deal.usage_limit) {
      return NextResponse.json({
        isValid: false,
        message: 'This deal has reached its usage limit'
      });
    }

    // Check customer usage limit if email provided
    if (customerEmail && deal.per_customer_limit > 0) {
      const { data: customerUsage, error: usageError } = await supabase
        .from('deal_usage')
        .select('id')
        .eq('deal_id', deal.id)
        .eq('customer_email', customerEmail);

      if (!usageError && customerUsage && customerUsage.length >= deal.per_customer_limit) {
        return NextResponse.json({
          isValid: false,
          message: 'You have already used this deal the maximum number of times'
        });
      }
    }

    // Calculate subtotal
    const subtotal = items.reduce((total: number, item: CartItem) => 
      total + (item.price * item.quantity), 0
    );

    // Check minimum order amount
    if (subtotal < deal.minimum_order_amount) {
      return NextResponse.json({
        isValid: false,
        message: `Minimum order amount of $${deal.minimum_order_amount.toFixed(2)} required`
      });
    }

    // Calculate discount amount based on deal type
    let discountAmount = 0;

    switch (deal.type) {
      case 'percentage':
        if (deal.percentage_off) {
          discountAmount = subtotal * (deal.percentage_off / 100);
          // Apply maximum discount cap if set
          if (deal.maximum_discount_amount && discountAmount > deal.maximum_discount_amount) {
            discountAmount = deal.maximum_discount_amount;
          }
        }
        break;

      case 'fixed_amount':
        if (deal.fixed_amount_off) {
          discountAmount = Math.min(deal.fixed_amount_off, subtotal);
        }
        break;

      case 'buy_x_get_y':
        if (deal.buy_quantity && deal.get_quantity) {
          // Calculate how many free items customer gets
          const totalQuantity = items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
          const setsOfBuyQuantity = Math.floor(totalQuantity / deal.buy_quantity);
          const freeItems = setsOfBuyQuantity * deal.get_quantity;
          
          // Find cheapest items to discount (simple implementation)
          const sortedItems = [...items].sort((a, b) => a.price - b.price);
          let remainingFreeItems = freeItems;
          
          for (const item of sortedItems) {
            if (remainingFreeItems <= 0) break;
            const itemsToDiscount = Math.min(remainingFreeItems, item.quantity);
            discountAmount += item.price * itemsToDiscount;
            remainingFreeItems -= itemsToDiscount;
          }
        }
        break;
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);
    discountAmount = Math.round(discountAmount * 100) / 100; // Round to 2 decimal places

    return NextResponse.json({
      isValid: true,
      deal,
      discountAmount,
      message: `Deal applied! You save $${discountAmount.toFixed(2)}`
    });

  } catch (error) {
    console.error('Error validating deal:', error);
    return NextResponse.json({
      isValid: false,
      message: 'Failed to validate deal code'
    }, { status: 500 });
  }
}
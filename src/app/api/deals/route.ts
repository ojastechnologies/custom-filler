import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - Fetch all deals
export async function GET() {
  try {
    const { data: deals, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ deals });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

// POST - Create new deal
export async function POST(request: NextRequest) {
  try {
    const dealData = await request.json();

    // Validate required fields
    if (!dealData.code || !dealData.name || !dealData.type) {
      return NextResponse.json(
        { error: 'Missing required fields: code, name, type' },
        { status: 400 }
      );
    }

    // Validate deal type specific fields
    if (dealData.type === 'percentage' && !dealData.percentage_off) {
      return NextResponse.json(
        { error: 'Percentage off is required for percentage deals' },
        { status: 400 }
      );
    }

    if (dealData.type === 'fixed_amount' && !dealData.fixed_amount_off) {
      return NextResponse.json(
        { error: 'Fixed amount off is required for fixed amount deals' },
        { status: 400 }
      );
    }

    if (dealData.type === 'buy_x_get_y' && (!dealData.buy_quantity || !dealData.get_quantity)) {
      return NextResponse.json(
        { error: 'Buy quantity and get quantity are required for buy X get Y deals' },
        { status: 400 }
      );
    }

    const { data: deal, error } = await supabase
      .from('deals')
      .insert([{
        ...dealData,
        code: dealData.code.toUpperCase(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Deal code already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    );
  }
}
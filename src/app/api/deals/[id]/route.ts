import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - Fetch single deal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: deal, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error('Error fetching deal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deal' },
      { status: 500 }
    );
  }
}

// PUT - Update deal
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dealData = await request.json();

    const { data: deal, error } = await supabase
      .from('deals')
      .update({
        ...dealData,
        code: dealData.code.toUpperCase(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Deal code already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    );
  }
}

// DELETE - Delete deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json(
      { error: 'Failed to delete deal' },
      { status: 500 }
    );
  }
}
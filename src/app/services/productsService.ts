import { supabase } from '@/lib/supabaseClient';

export const fetchProducts = async () => {
  console.log('Fetching products from Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    const transformedData = data.map(item => {
      return {
        id: item.id,
        title: item.name,
        name: item.name,
        price: item.unit_price || 0,
        image: item.thumbnail_url || '/placeholder-product.jpg',
        description: item.description || 'No description available'
      };
    });
    
    return transformedData;
  } catch (err) {
    console.error('Error in fetchProducts:', err);
    throw err;
  }
};

// Admin functions

export const createProduct = async (product: {
  name: string;
  description?: string;
  unit_price: number;
  thumbnail_url?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error('Error creating product:', err);
    throw err;
  }
};

export const updateProduct = async (id: string, updates: {
  name?: string;
  description?: string;
  unit_price?: number;
  thumbnail_url?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error('Error updating product:', err);
    throw err;
  }
};

export const deleteProduct = async (id: string) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting product:', err);
    throw err;
  }
};

export const getProductById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching product:', err);
    throw err;
  }
};

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
      console.log('Transforming item:', item);
      return {
        id: item.asid || item.id,
        title: item.name,
        name: item.name,
        price: item.unit_price || 0,
        image: item.thumbnail_url || '/placeholder-product.jpg',
        description: item.description || 'No description available'
      };
    });
    
    console.log('Transformed products data:', transformedData);
    
    return transformedData;
  } catch (err) {
    console.error('Error in fetchProducts:', err);
    throw err;
  }
};

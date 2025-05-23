import { createClient } from '@supabase/supabase-js';
 import { supabase } from '@/lib/supabaseClient';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const publicClient = createClient(supabaseUrl, supabaseAnonKey);

export const fetchProducts = async () => {
  console.log('Fetching products from Supabase...');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('Using URL:', supabaseUrl.substring(0, 30) + '...');
  
  try {
    const { data, error } = await publicClient
      .from('products')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Fetched products:', data);
    
    if (!data || data.length === 0) {
      console.log('No products found in database');
      return [];
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

export const uploadProductImage = async (file: File): Promise<string> => {
  try {

    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `product-${timestamp}.${fileExtension}`;
    const filePath = `/images/upload/${fileName}`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', filePath);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }
    
    const data = await response.json();
    return data.url; 
  } catch (err) {
    console.error('Error uploading image:', err);
    throw err;
  }
};


export const createProduct = async (product: {
  name: string;
  description?: string;
  unit_price: number;
  thumbnail_url?: string;
  imageFile?: File;
}) => {
  try {
    console.log('Creating product:', product);
    
    let imageUrl = product.thumbnail_url || '';
    
    if (product.imageFile) {
      imageUrl = await uploadProductImage(product.imageFile);
    }
    
    const { error: tableError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
      
    if (tableError) {
      console.error('Error checking products table:', tableError);
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: product.name,
        description: product.description,
        unit_price: product.unit_price,
        thumbnail_url: imageUrl
      }])
      .select();

    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }
    
    console.log('Product created successfully:', data);
    
    if (data && data.length > 0) {
      return data[0];
    } else {
      console.warn('No data returned from insert operation');
      return {
        id: 'temp-' + Date.now(),
        name: product.name,
        description: product.description,
        unit_price: product.unit_price,
        thumbnail_url: imageUrl
      };
    }
  } catch (err) {
    console.error('Error in createProduct:', err);
    throw err;
  }
};

export const updateProduct = async (id: string, updates: {
  name?: string;
  description?: string;
  unit_price?: number;
  thumbnail_url?: string;
  imageFile?: File;
}) => {
  try {
    console.log(`Updating product ${id}:`, updates);
    
    // Get the existing product to check for image replacement
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
      
    if (checkError) {
      console.error('Error checking product existence:', checkError);
    } else {
      console.log('Existing product:', existingProduct);
    }
    
    let imageUrl = updates.thumbnail_url;
    
    // If a new image file is provided, upload it
    if (updates.imageFile) {
      imageUrl = await uploadProductImage(updates.imageFile);
      
      // Delete the old image if it exists and is different from the new one
      if (existingProduct?.thumbnail_url && 
          existingProduct.thumbnail_url !== imageUrl && 
          existingProduct.thumbnail_url.startsWith('/images/upload/')) {
        await deleteImageFile(existingProduct.thumbnail_url);
      }
    }
    
    const { data, error } = await supabase
      .from('products')
      .update({
        name: updates.name,
        description: updates.description,
        unit_price: updates.unit_price,
        thumbnail_url: imageUrl
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }
    
    console.log('Update operation result:', data);
    
    if (data && data.length > 0) {
      return data[0];
    } else {
      console.warn('No data returned from update operation');
      return {
        id: id,
        ...existingProduct,
        ...updates,
        thumbnail_url: imageUrl
      };
    }
  } catch (err) {
    console.error('Error in updateProduct:', err);
    throw err;
  }
};

export const deleteProduct = async (id: string) => {
  try {
    console.log(`Deleting product ${id}`);
    
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id, thumbnail_url')
      .eq('id', id)
      .single();
      
    if (checkError) {
      console.error('Error checking product existence:', checkError);
    } else {
      console.log('Product to delete exists:', existingProduct);
      
      // Delete the associated image file if it exists
      if (existingProduct?.thumbnail_url) {
        await deleteImageFile(existingProduct.thumbnail_url);
      }
    }
    
    const { error, count } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
    
    console.log(`Deleted ${count} product(s)`);
    return true;
  } catch (err) {
    console.error('Error in deleteProduct:', err);
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
    
    return {
      id: data.id,
      title: data.name,
      name: data.name,
      price: data.unit_price || 0,
      image: data.thumbnail_url || '/placeholder-product.jpg',
      description: data.description || 'No description available'
    };
  } catch (err) {
    console.error('Error fetching product:', err);
    throw err;
  }
};

// Function to delete an image file from the upload folder
const deleteImageFile = async (imageUrl: string) => {
  if (!imageUrl || !imageUrl.startsWith('/images/upload/')) {
    console.log('No valid image URL to delete');
    return;
  }

  try {
    const response = await fetch('/api/delete-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete image');
    }
    
    console.log(`Successfully deleted image: ${imageUrl}`);
  } catch (error) {
    console.error('Error deleting image file:', error);
  }
};

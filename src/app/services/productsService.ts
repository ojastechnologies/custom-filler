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
    
    console.log('Fetched products:', data);
    
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

// Helper function to upload an image
export const uploadProductImage = async (file: File): Promise<string> => {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `product-${timestamp}.${fileExtension}`;
    const filePath = `/images/upload/${fileName}`;
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', filePath);
    
    // Send the file to our upload API endpoint
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }
    
    const data = await response.json();
    return data.url; // Return the URL of the uploaded image
  } catch (err) {
    console.error('Error uploading image:', err);
    throw err;
  }
};

// Admin functions
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
    
    // If there's an image file, upload it first
    if (product.imageFile) {
      imageUrl = await uploadProductImage(product.imageFile);
    }
    
    // First, check if the table exists and has the right structure
    const { error: tableError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
      
    if (tableError) {
      console.error('Error checking products table:', tableError);
      // Table might not exist or have permission issues
    }
    
    // Insert the new product
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
    
    // If data is returned, use it; otherwise, use the input with a temporary ID
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
    
    let imageUrl = updates.thumbnail_url;
    
    // If there's an image file, upload it first
    if (updates.imageFile) {
      imageUrl = await uploadProductImage(updates.imageFile);
    }
    
    // First, check if the product exists
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
      
    if (checkError) {
      console.error('Error checking product existence:', checkError);
      // Product might not exist
    } else {
      console.log('Existing product:', existingProduct);
    }
    
    // Update the product
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
    
    // If data is returned, use it; otherwise, use the updates with the original ID
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
    
    // First, check if the product exists and get its image URL
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id, thumbnail_url')
      .eq('id', id)
      .single();
      
    if (checkError) {
      console.error('Error checking product existence:', checkError);
      // Product might not exist
    } else {
      console.log('Product to delete exists:', existingProduct);
      
      // Note: If you want to also delete the image file from the server,
      // you would need to implement an API endpoint for that and call it here
    }
    
    // Delete the product
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

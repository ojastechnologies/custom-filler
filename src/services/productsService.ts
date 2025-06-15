import { supabase } from '@/lib/supabaseClient';
import { ProductType } from '@/types/product';

export const fetchProducts = async (): Promise<ProductType[]> => {
  try {
    console.log('🔍 Fetching products with deals...');
    
    // First, let's try a simple query without the join to see if basic products work
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        deals:deal_id (
          id,
          code,
          description,
          discount_type,
          discount_value,
          minimum_order_amount,
          maximum_discount_amount,
          usage_limit,
          usage_count,
          expires_at,
          is_active,
          created_at,
          updated_at
        )
      `);
      
    if (error) {
      console.error('❌ Supabase error:', error);
      
      // Fallback: Try fetching products without deals if the join fails
      console.log('🔄 Falling back to products without deals...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('products')
        .select('*');
        
      if (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError);
        throw fallbackError;
      }
      
      if (!fallbackData || fallbackData.length === 0) return [];
      
      // Map fallback data without deals
      return fallbackData.map(item => ({
        id: item.id,
        title: item.name,
        price: item.unit_price || 0,
        image: item.thumbnail_url || '/placeholder-product.jpg',
        description: item.description || 'No description available',
        category: item.category || undefined,
        about_url: item.about_url || undefined,
        clientpathurl: item.clientpathurl || undefined,
        deal_id: item.deal_id || undefined,
        deal: undefined // No deal information in fallback
      }));
    }
    
    if (!data || data.length === 0) return [];
    
    console.log('✅ Products fetched successfully:', data.length);
    console.log('📊 Sample product with deal:', data[0]);
    
    return data.map(item => ({
      id: item.id,
      title: item.name,
      price: item.unit_price || 0,
      image: item.thumbnail_url || '/placeholder-product.jpg',
      description: item.description || 'No description available',
      category: item.category || undefined,
      about_url: item.about_url || undefined,
      clientpathurl: item.clientpathurl || undefined,
      deal_id: item.deal_id || undefined,
      deal: item.deals || undefined // This will be the joined deal data
    }));
  } catch (err) {
    console.error('❌ Error fetching products:', err);
    console.error('❌ Error details:', JSON.stringify(err, null, 2));
    throw err;
  }
};

// Add this new function for testing
export const fetchProductsSimple = async (): Promise<ProductType[]> => {
  try {
    console.log('🔍 Fetching products (simple version)...');
    
    const { data, error } = await supabase
      .from('products')
      .select('*');
      
    if (error) {
      console.error('❌ Simple fetch error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) return [];
    
    console.log('✅ Simple products fetched:', data.length);
    
    return data.map(item => ({
      id: item.id,
      title: item.name,
      price: item.unit_price || 0,
      image: item.thumbnail_url || '/placeholder-product.jpg',
      description: item.description || 'No description available',
      category: item.category || undefined,
      about_url: item.about_url || undefined,
      clientpathurl: item.clientpathurl || undefined,
      deal_id: item.deal_id || undefined,
      deal: undefined // No deal for now
    }));
  } catch (err) {
    console.error('❌ Error in simple fetch:', err);
    throw err;
  }
};

export const uploadProductImage = async (file: File): Promise<string> => {
  console.log('[uploadProductImage] Called with file:', file?.name, file?.size);
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const fileName = `product-${timestamp}.${fileExt}`;
  const filePath = `products/${fileName}`;
  if (!file || file.size === 0) throw new Error('No file or file is empty');
  const { data, error } = await supabase.storage.from('images').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    throw new Error(`Supabase upload error: ${error.message || JSON.stringify(error)}`);
  }
  if (!data || !data.path) throw new Error('Image upload failed: No path returned');
  const publicUrlData = supabase.storage.from('images').getPublicUrl(filePath);
  if (!publicUrlData || !publicUrlData.data || !publicUrlData.data.publicUrl) throw new Error('Image upload failed: No public URL');
  console.log('[uploadProductImage] Uploaded to:', filePath, 'Public URL:', publicUrlData.data.publicUrl);
  
  const { data: verifyList, error: verifyError } = await supabase.storage.from('images').list('products');
  console.log('[uploadProductImage] Files after upload:', verifyList?.map(f => f.name));
  if (verifyError) console.error('[uploadProductImage] Verify list error:', verifyError);
  
  return publicUrlData.data.publicUrl;
};

export const deleteProductImage = async (imageUrl: string) => {
  console.log('[deleteProductImage] Starting deletion for URL:', imageUrl);
  if (!imageUrl) {
    console.log('[deleteProductImage] No URL provided, skipping delete');
    return false;
  }
  
  if (imageUrl === '/placeholder-product.jpg' || imageUrl.includes('placeholder')) {
    console.log('[deleteProductImage] Skipping placeholder image');
    return true;
  }
  
  try {
    let filePath = '';
    
    if (imageUrl.includes('/storage/v1/object/public/images/')) {
      const imagePart = imageUrl.split('/storage/v1/object/public/images/')[1];
      if (imagePart) {
        filePath = imagePart.split('?')[0];
      }
    } else if (imageUrl.startsWith('products/')) {
      filePath = imageUrl.split('?')[0];
    } else if (imageUrl.includes('/')) {
      const fileName = imageUrl.split('/').pop()?.split('?')[0] || '';
      if (fileName && fileName.includes('.')) {
        filePath = `products/${fileName}`;
      }
    }
    
    if (!filePath || !filePath.includes('/')) {
      console.warn('[deleteProductImage] Could not extract valid file path from URL:', imageUrl);
      return false;
    }
    
    console.log('[deleteProductImage] Extracted file path:', filePath);
    
    if (filePath === 'products/' || !filePath.startsWith('products/')) {
      console.error('[deleteProductImage] Invalid file path format:', filePath);
      console.error('[deleteProductImage] Expected format: products/filename.ext');
      return false;
    }
    console.log('[deleteProductImage] Attempting to delete with full path:', filePath);
    console.log('[deleteProductImage] Delete array:', [filePath]);
    const { data, error } = await supabase.storage.from('images').remove([filePath]);
    
    if (error) {
      console.error('[deleteProductImage] Error deleting file:', error);
      return false;
    }
    
    console.log('[deleteProductImage] Delete response data:', data);
    console.log('[deleteProductImage] Successfully deleted file:', filePath);
    return true;
    
  } catch (err) {
    console.error('[deleteProductImage] Exception during deletion:', err);
    return false;
  }
};

export const deleteProductImageDirect = async (imageUrl: string) => {
  console.log('[deleteProductImageDirect] Starting deletion for URL:', imageUrl);
  if (!imageUrl) return false;
  
  if (imageUrl === '/placeholder-product.jpg' || imageUrl.includes('placeholder')) {
    console.log('[deleteProductImageDirect] Skipping placeholder image');
    return true;
  }
  
  try {
    let filePath = '';
    
    if (imageUrl.includes('/storage/v1/object/public/images/')) {
      const imagePart = imageUrl.split('/storage/v1/object/public/images/')[1];
      if (imagePart) {
        filePath = imagePart.split('?')[0];
      }
    } else if (imageUrl.startsWith('products/')) {
      filePath = imageUrl.split('?')[0];
    } else if (imageUrl.includes('/')) {
      const fileName = imageUrl.split('/').pop()?.split('?')[0] || '';
      if (fileName && fileName.includes('.')) {
        filePath = `products/${fileName}`;
      }
    }
    
    if (!filePath || !filePath.includes('/') || !filePath.startsWith('products/')) {
      console.warn('[deleteProductImageDirect] Could not extract valid file path from URL:', imageUrl);
      return false;
    }
    
    console.log('[deleteProductImageDirect] Extracted file path for direct API:', filePath);
    
    const { data: { session } } = await supabase.auth.getSession();
    const deleteUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/images/${filePath}`;
    console.log('[deleteProductImageDirect] DELETE URL:', deleteUrl);
    
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[deleteProductImageDirect] Response status:', response.status);
    const responseText = await response.text();
    console.log('[deleteProductImageDirect] Response body:', responseText);
    
    return response.ok;
  } catch (err) {
    console.error('[deleteProductImageDirect] Error:', err);
    return false;
  }
};

export const createProduct = async (product: {
  name: string;
  description?: string;
  unit_price: number;
  thumbnail_url?: string;
  imageFile?: File;
  category?: string;
  about_url?: string;
  clientpathurl?: string;
  deal_id?: string; // NEW: Add deal_id
}): Promise<ProductType> => {
  try {
    let imageUrl = product.thumbnail_url;
    let uploadedNewImage = false;
    
    if (product.imageFile && !imageUrl) {
      console.log('[createProduct] Uploading new image');
      imageUrl = await uploadProductImage(product.imageFile);
      uploadedNewImage = true;
      console.log('[createProduct] Uploaded image URL:', imageUrl);
    } else if (imageUrl) {
      console.log('[createProduct] Using provided thumbnail URL:', imageUrl);
    } else {
      console.log('[createProduct] No image provided, using placeholder');
    }
    
    console.log('[createProduct] Inserting product:', {
      name: product.name,
      description: product.description,
      unit_price: product.unit_price,
      thumbnail_url: imageUrl,
      about_url: product.about_url,
      clientpathurl: product.clientpathurl,
      deal_id: product.deal_id,
    });
    
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name: product.name,
          description: product.description,
          unit_price: product.unit_price,
          thumbnail_url: imageUrl,
          about_url: product.about_url,
          clientpathurl: product.clientpathurl,
          deal_id: product.deal_id || null,
        },
      ])
      .select(`
        *,
        deals (*)
      `);
      
    if (error) {
      console.error('[createProduct] Supabase insert error:', error);
      if (uploadedNewImage && imageUrl) {
        console.log('[createProduct] Product creation failed, deleting orphaned image');
        await deleteProductImage(imageUrl);
      }
      throw error;
    }
    
    if (!data || !data[0]) {
      console.error('[createProduct] No data returned from insert:', data);
      if (uploadedNewImage && imageUrl) {
        console.log('[createProduct] Product creation failed, deleting orphaned image');
        await deleteProductImage(imageUrl);
      }
      throw new Error('No data returned from insert');
    }
    
    return {
      id: data[0].id,
      title: data[0].name,
      price: data[0].unit_price,
      image: data[0].thumbnail_url,
      description: data[0].description,
      category: data[0].category,
      about_url: data[0].about_url,
      clientpathurl: data[0].clientpathurl,
      deal_id: data[0].deal_id,
      deal: data[0].deals,
    };
  } catch (err) {
    console.error('[createProduct] Caught error:', err);
    throw err;
  }
};

export const updateProduct = async (
  id: string,
  updates: Partial<Omit<ProductType, 'id'>> & { imageFile?: File; deal_id?: string }
): Promise<ProductType> => {
  try {
    console.log(`[updateProduct] Starting update for product ID: ${id}`);
    
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
      
    if (checkError) {
      console.error('[updateProduct] Error checking product existence:', checkError);
      throw checkError;
    }
    
    console.log('[updateProduct] Found existing product:', existingProduct?.name);
    
    let imageUrl = updates.image;
    let isNewImage = false;
    
    if (updates.imageFile) {
      console.log('[updateProduct] Uploading new image file');
      imageUrl = await uploadProductImage(updates.imageFile);
      isNewImage = true;
      console.log('[updateProduct] New image URL:', imageUrl);
      
      if (existingProduct?.thumbnail_url && existingProduct.thumbnail_url !== imageUrl) {
        console.log('[updateProduct] Deleting old image:', existingProduct.thumbnail_url);
        await deleteProductImage(existingProduct.thumbnail_url);
      }
    } else {
      console.log('[updateProduct] No new image file, keeping existing or provided URL');
    }
    
    console.log('[updateProduct] Updating product with:', {
      name: updates.title,
      description: updates.description,
      unit_price: updates.price,
      thumbnail_url: imageUrl,
      about_url: updates.about_url,
      clientpathurl: updates.clientpathurl,
      deal_id: updates.deal_id
    });
    
    const { data, error } = await supabase
      .from('products')
      .update({
        name: updates.title,
        description: updates.description,
        unit_price: updates.price,
        thumbnail_url: imageUrl,
        about_url: updates.about_url,
        clientpathurl: updates.clientpathurl,
        deal_id: updates.deal_id || null
      })
      .eq('id', id)
      .select(`
        *,
        deals (*)
      `);
      
    if (error) {
      console.error('[updateProduct] Update failed:', error);
      if (isNewImage && imageUrl) {
        console.log('[updateProduct] Update failed, cleaning up orphaned image');
        await deleteProductImage(imageUrl);
      }
      
      throw error;
    }
    
    if (!data || !data[0]) {
      console.error('[updateProduct] No data returned from update');
      
      if (isNewImage && imageUrl) {
        console.log('[updateProduct] No data returned, cleaning up orphaned image');
        await deleteProductImage(imageUrl);
      }
      
      throw new Error('No data returned from update');
    }
    
    console.log('[updateProduct] Product updated successfully:', data[0].name);
    
    return {
      id: data[0].id,
      title: data[0].name,
      price: data[0].unit_price,
      image: data[0].thumbnail_url,
      description: data[0].description,
      category: data[0].category,
      about_url: data[0].about_url,
      clientpathurl: data[0].clientpathurl,
      deal_id: data[0].deal_id,
      deal: data[0].deals
    };
  } catch (err) {
    console.error('[updateProduct] Error during update:', err);
    throw err;
  }
};

export const deleteProduct = async (id: string) => {
  try {
    console.log(`[deleteProduct] Starting deletion for product ID: ${id}`);
    
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id, thumbnail_url')
      .eq('id', id)
      .single();
      
    if (checkError) {
      console.error('[deleteProduct] Error checking product existence:', checkError);
      throw checkError;
    }
    
    if (existingProduct?.thumbnail_url) {
      console.log('[deleteProduct] Found image to delete:', existingProduct.thumbnail_url);
      try {
        const deleteSuccess = await deleteProductImage(existingProduct.thumbnail_url);
        if (!deleteSuccess) {
          console.log('[deleteProduct] Standard delete failed, trying direct API call');
          await deleteProductImageDirect(existingProduct.thumbnail_url);
        }
        console.log('[deleteProduct] Image deletion completed');
      } catch (imageError) {
        console.error('[deleteProduct] Failed to delete image, but will continue with product deletion:', imageError);
      }
    } else {
      console.log('[deleteProduct] No image found for product');
    }
    
    console.log('[deleteProduct] Deleting product from database');
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('[deleteProduct] Error deleting product from database:', error);
      throw error;
    }
    
    console.log('[deleteProduct] Product successfully deleted');
    return true;
  } catch (err) {
    console.error('[deleteProduct] Error during product deletion:', err);
    throw err;
  }
};

export const ensureImagesBucket = async () => {
  try {
    const { data, error } = await supabase.storage.createBucket('images', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 5242880 // 5MB
    });
    
    if (error && !error.message.includes('already exists')) {
      console.error('[ensureImagesBucket] Error creating bucket:', error);
      return false;
    }
    
    console.log('[ensureImagesBucket] Bucket exists or created:', data);
    return true;
  } catch (err) {
    console.error('[ensureImagesBucket] Exception:', err);
    return false;
  }
};

export const debugStorageBucket = async () => {
  try {
    console.log('[debugStorageBucket] Checking bucket status...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('[debugStorageBucket] Available buckets:', buckets);
    if (bucketsError) console.error('[debugStorageBucket] Buckets error:', bucketsError);
    
    const imagesBucket = buckets?.find(b => b.name === 'images');
    console.log('[debugStorageBucket] Images bucket:', imagesBucket);
    
    const { data: rootFiles, error: rootError } = await supabase.storage.from('images').list('');
    console.log('[debugStorageBucket] Root files in images bucket:', rootFiles);
    if (rootError) console.error('[debugStorageBucket] Root list error:', rootError);
    
    const { data: productFiles, error: productError } = await supabase.storage.from('images').list('products');
    console.log('[debugStorageBucket] Files in products folder:', productFiles);
    if (productError) console.error('[debugStorageBucket] Products list error:', productError);
    
    return { buckets, imagesBucket, rootFiles, productFiles };
  } catch (err) {
    console.error('[debugStorageBucket] Exception:', err);
    return null;
  }
};

export const testImageUrlParsing = (imageUrl: string) => {
  console.log('\n=== Testing URL Parsing ===');
  console.log('Input URL:', imageUrl);
  
  let filePath = '';
  
  if (imageUrl.includes('/storage/v1/object/public/images/')) {
    const imagePart = imageUrl.split('/storage/v1/object/public/images/')[1];
    if (imagePart) {
      filePath = imagePart.split('?')[0]; 
    }
    console.log('Detected: Full Supabase Storage URL');
    console.log('Extracted image part:', imagePart);
  } else if (imageUrl.startsWith('products/')) {
    filePath = imageUrl.split('?')[0];
    console.log('Detected: Already in correct format');
  } else if (imageUrl.includes('/')) {
    const fileName = imageUrl.split('/').pop()?.split('?')[0] || '';
    if (fileName && fileName.includes('.')) {
      filePath = `products/${fileName}`;
    }
    console.log('Detected: Path with filename');
    console.log('Extracted filename:', fileName);
  }
  
  console.log('Final file path:', filePath);
  console.log('Valid path?', filePath && filePath.includes('/') && filePath.startsWith('products/'));
  console.log('=== End Test ===\n');
  
  return filePath;
};

// Add this debug function
export const debugDatabaseConnection = async () => {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.error('❌ Basic connection failed:', testError);
      return false;
    }
    
    console.log('✅ Basic connection works');
    
    // Test deals table
    const { data: dealsData, error: dealsError } = await supabase
      .from('deals')
      .select('count')
      .limit(1);
      
    if (dealsError) {
      console.error('❌ Deals table access failed:', dealsError);
      console.log('ℹ️ This might be normal if deals table doesn\'t exist yet');
    } else {
      console.log('✅ Deals table accessible');
    }
    
    // Test products with deal_id column
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name, deal_id')
      .limit(1);
      
    if (productsError) {
      console.error('❌ Products with deal_id failed:', productsError);
      console.log('ℹ️ deal_id column might not exist yet');
    } else {
      console.log('✅ Products with deal_id accessible:', productsData);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Database debug failed:', err);
    return false;
  }
};

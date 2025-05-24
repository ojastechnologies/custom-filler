import { supabase } from '@/lib/supabaseClient';
import { ProductType } from '@/types/product';

// Helper to clear Supabase session (localStorage/cookies)
const clearSupabaseSession = async () => {
  try {
    await supabase.auth.signOut();
    // Remove legacy keys if present
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refresh_token');
    localStorage.removeItem('supabase.auth.access_token');
  } catch {
    // Ignore
  }
};

export const fetchProducts = async (): Promise<ProductType[]> => {
  let triedClearingSession = false;
  while (true) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');
      if (error) throw error;
      if (!data || data.length === 0) return [];
      return data.map(item => ({
        id: item.id,
        title: item.name,
        price: item.unit_price || 0,
        image: item.thumbnail_url || '/placeholder-product.jpg',
        description: item.description || 'No description available',
        category: item.category || undefined,
        about_url: item.about_url || undefined,
      }));
    } catch (err) {
      // If error is auth/session related and we haven't retried, clear session and retry once
      if (!triedClearingSession && typeof err === 'object' && err !== null &&
        ('code' in err || 'message' in err) &&
        ((err as { code?: string }).code === '401' || (err as { code?: string }).code === '403' ||
         ((err as { message?: string }).message && (err as { message: string }).message.toLowerCase().includes('jwt')))
      ) {
        await clearSupabaseSession();
        triedClearingSession = true;
        continue;
      }
      throw err;
    }
  }
};

// Upload product image to Supabase Storage (images/products/filename)
export const uploadProductImage = async (file: File): Promise<string> => {
  console.log('[uploadProductImage] Called with file:', file?.name, file?.size);
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const fileName = `product-${timestamp}.${fileExt}`;
  const filePath = `products/${fileName}`;
  // Check if file is valid and not empty
  if (!file || file.size === 0) throw new Error('No file or file is empty');
  // Check if bucket exists (optional, for debugging)
  // const { data: bucketList } = await supabase.storage.listBuckets();
  // console.log('Supabase buckets:', bucketList);
  // Upload file
  const { data, error } = await supabase.storage.from('images').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    // Add more details to the error for debugging
    throw new Error(`Supabase upload error: ${error.message || JSON.stringify(error)}`);
  }
  if (!data || !data.path) throw new Error('Image upload failed: No path returned');
  // Get public URL
  const publicUrlData = supabase.storage.from('images').getPublicUrl(filePath);
  if (!publicUrlData || !publicUrlData.data || !publicUrlData.data.publicUrl) throw new Error('Image upload failed: No public URL');
  console.log('[uploadProductImage] Uploaded to:', filePath, 'Public URL:', publicUrlData.data.publicUrl);
  
  // Verify the upload by listing files
  const { data: verifyList, error: verifyError } = await supabase.storage.from('images').list('products');
  console.log('[uploadProductImage] Files after upload:', verifyList?.map(f => f.name));
  if (verifyError) console.error('[uploadProductImage] Verify list error:', verifyError);
  
  return publicUrlData.data.publicUrl;
};

// Delete product image from Supabase Storage (images/products/filename)
export const deleteProductImage = async (imageUrl: string) => {
  console.log('[deleteProductImage] Starting deletion for URL:', imageUrl);
  if (!imageUrl) {
    console.log('[deleteProductImage] No URL provided, skipping delete');
    return false;
  }
  
  // Check if it's a placeholder image
  if (imageUrl === '/placeholder-product.jpg' || imageUrl.includes('placeholder')) {
    console.log('[deleteProductImage] Skipping placeholder image');
    return true;
  }
  
  try {
    // Extract the full file path from the Supabase Storage URL
    let filePath = '';
    
    if (imageUrl.includes('/storage/v1/object/public/images/')) {
      // Full Supabase Storage URL: extract everything after '/images/'
      const imagePart = imageUrl.split('/storage/v1/object/public/images/')[1];
      if (imagePart) {
        filePath = imagePart.split('?')[0]; // Remove query parameters
      }
    } else if (imageUrl.startsWith('products/')) {
      // Already in the correct format
      filePath = imageUrl.split('?')[0];
    } else if (imageUrl.includes('/')) {
      // Try to extract filename and assume it's in products folder
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
    
    // Validate the file path
    if (filePath === 'products/' || !filePath.startsWith('products/')) {
      console.error('[deleteProductImage] Invalid file path format:', filePath);
      console.error('[deleteProductImage] Expected format: products/filename.ext');
      return false;
    }
    
    // Attempt deletion with the full path
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

// Alternative delete function using direct REST API call
export const deleteProductImageDirect = async (imageUrl: string) => {
  console.log('[deleteProductImageDirect] Starting deletion for URL:', imageUrl);
  if (!imageUrl) return false;
  
  if (imageUrl === '/placeholder-product.jpg' || imageUrl.includes('placeholder')) {
    console.log('[deleteProductImageDirect] Skipping placeholder image');
    return true;
  }
  
  try {
    // Extract the full file path from the Supabase Storage URL (same logic as deleteProductImage)
    let filePath = '';
    
    if (imageUrl.includes('/storage/v1/object/public/images/')) {
      // Full Supabase Storage URL: extract everything after '/images/'
      const imagePart = imageUrl.split('/storage/v1/object/public/images/')[1];
      if (imagePart) {
        filePath = imagePart.split('?')[0]; // Remove query parameters
      }
    } else if (imageUrl.startsWith('products/')) {
      // Already in the correct format
      filePath = imageUrl.split('?')[0];
    } else if (imageUrl.includes('/')) {
      // Try to extract filename and assume it's in products folder
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
    
    // Get auth headers
    const { data: { session } } = await supabase.auth.getSession();
    
    // Direct REST API call with fully qualified path
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
}): Promise<ProductType> => {
  try {
    let imageUrl = product.thumbnail_url;
    let uploadedNewImage = false;
    
    // Only upload if we have an imageFile and no thumbnail URL
    // This prevents double uploads
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
    
    // Diagnostic log for product payload
    console.log('[createProduct] Inserting product:', {
      name: product.name,
      description: product.description,
      unit_price: product.unit_price,
      thumbnail_url: imageUrl,
      about_url: product.about_url,
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
        },
      ])
      .select();
      
    if (error) {
      console.error('[createProduct] Supabase insert error:', error);
      // If we uploaded an image but product creation failed, delete the orphaned image
      if (uploadedNewImage && imageUrl) {
        console.log('[createProduct] Product creation failed, deleting orphaned image');
        await deleteProductImage(imageUrl);
      }
      throw error;
    }
    
    if (!data || !data[0]) {
      console.error('[createProduct] No data returned from insert:', data);
      // If we uploaded an image but product creation failed, delete the orphaned image
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
    };
  } catch (err) {
    console.error('[createProduct] Caught error:', err);
    throw err;
  }
};

export const updateProduct = async (
  id: string,
  updates: Partial<Omit<ProductType, 'id'>> & { imageFile?: File }
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
    
    // Track the image URL to use in the update
    let imageUrl = updates.image;
    let isNewImage = false;
    
    // If there's a new image file, upload it
    if (updates.imageFile) {
      console.log('[updateProduct] Uploading new image file');
      imageUrl = await uploadProductImage(updates.imageFile);
      isNewImage = true;
      console.log('[updateProduct] New image URL:', imageUrl);
      
      // If the existing product has a different image, delete the old one
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
      about_url: updates.about_url
    });
    
    const { data, error } = await supabase
      .from('products')
      .update({
        name: updates.title,
        description: updates.description,
        unit_price: updates.price,
        thumbnail_url: imageUrl,
        about_url: updates.about_url,
      })
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('[updateProduct] Update failed:', error);
      
      // If we uploaded a new image but the update failed, delete the orphaned image
      if (isNewImage && imageUrl) {
        console.log('[updateProduct] Update failed, cleaning up orphaned image');
        await deleteProductImage(imageUrl);
      }
      
      throw error;
    }
    
    if (!data || !data[0]) {
      console.error('[updateProduct] No data returned from update');
      
      // If we uploaded a new image but got no data, clean up
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
    
    // Delete the image first if it exists
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
        // Log but continue with product deletion even if image deletion fails
        console.error('[deleteProduct] Failed to delete image, but will continue with product deletion:', imageError);
      }
    } else {
      console.log('[deleteProduct] No image found for product');
    }
    
    // Now delete the product
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

// Function to ensure bucket exists
export const ensureImagesBucket = async () => {
  try {
    // Try to create the bucket (will fail if it already exists, which is fine)
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

// Debug function to check bucket status
export const debugStorageBucket = async () => {
  try {
    console.log('[debugStorageBucket] Checking bucket status...');
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('[debugStorageBucket] Available buckets:', buckets);
    if (bucketsError) console.error('[debugStorageBucket] Buckets error:', bucketsError);
    
    // Check if 'images' bucket exists
    const imagesBucket = buckets?.find(b => b.name === 'images');
    console.log('[debugStorageBucket] Images bucket:', imagesBucket);
    
    // Try to list files in the root of images bucket
    const { data: rootFiles, error: rootError } = await supabase.storage.from('images').list('');
    console.log('[debugStorageBucket] Root files in images bucket:', rootFiles);
    if (rootError) console.error('[debugStorageBucket] Root list error:', rootError);
    
    // Try to list files in products folder
    const { data: productFiles, error: productError } = await supabase.storage.from('images').list('products');
    console.log('[debugStorageBucket] Files in products folder:', productFiles);
    if (productError) console.error('[debugStorageBucket] Products list error:', productError);
    
    return { buckets, imagesBucket, rootFiles, productFiles };
  } catch (err) {
    console.error('[debugStorageBucket] Exception:', err);
    return null;
  }
};

// Test function to verify URL parsing logic
export const testImageUrlParsing = (imageUrl: string) => {
  console.log('\n=== Testing URL Parsing ===');
  console.log('Input URL:', imageUrl);
  
  let filePath = '';
  
  if (imageUrl.includes('/storage/v1/object/public/images/')) {
    // Full Supabase Storage URL: extract everything after '/images/'
    const imagePart = imageUrl.split('/storage/v1/object/public/images/')[1];
    if (imagePart) {
      filePath = imagePart.split('?')[0]; // Remove query parameters
    }
    console.log('Detected: Full Supabase Storage URL');
    console.log('Extracted image part:', imagePart);
  } else if (imageUrl.startsWith('products/')) {
    // Already in the correct format
    filePath = imageUrl.split('?')[0];
    console.log('Detected: Already in correct format');
  } else if (imageUrl.includes('/')) {
    // Try to extract filename and assume it's in products folder
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

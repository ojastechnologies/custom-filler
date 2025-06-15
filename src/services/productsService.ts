import { supabase } from '@/lib/supabaseClient';
import { ProductType } from '@/types/product';

export const fetchProductsWithDeals = async (): Promise<ProductType[]> => {
  try {
    console.log('[fetchProductsWithDeals] � Fetching products with deal information');
    
    // Fetch products with their assigned deals
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('[fetchProductsWithDeals] ❌ Error fetching products:', productsError);
      throw productsError;
    }

    if (!productsData || productsData.length === 0) {
      console.log('[fetchProductsWithDeals] ℹ️ No products found');
      return [];
    }

    console.log('[fetchProductsWithDeals] ✅ Found', productsData.length, 'products');

    // Get all unique deal IDs
    const dealIds = productsData
      .map(product => product.assigned_deal_id)
      .filter(Boolean);

    console.log('[fetchProductsWithDeals] 🎫 Found deal IDs:', dealIds);

    // Fetch deal information if there are any deals
    let dealsData: any[] = [];
    if (dealIds.length > 0) {
      const { data: fetchedDeals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .in('id', dealIds);

      if (dealsError) {
        console.error('[fetchProductsWithDeals] ⚠️ Error fetching deals:', dealsError);
        // Continue without deals rather than failing completely
      } else {
        dealsData = fetchedDeals || [];
        console.log('[fetchProductsWithDeals] ✅ Fetched', dealsData.length, 'deals');
      }
    }

    // Create a map of deals for quick lookup
    const dealsMap = new Map();
    dealsData.forEach(deal => {
      dealsMap.set(deal.id, deal);
    });

    // Map products with their associated deals
    const products: ProductType[] = productsData.map(product => {
      const associatedDeal = product.assigned_deal_id ? dealsMap.get(product.assigned_deal_id) : null;
      
      console.log(`[fetchProductsWithDeals] 🔄 Product: ${product.name}, Deal: ${associatedDeal?.code || 'None'}`);

      return {
        id: product.id,
        title: product.name,
        price: product.unit_price,
        image: product.thumbnail_url,
        description: product.description,
        category: product.category,
        about_url: product.about_url,
        clientpathurl: product.clientpathurl,
        deal_id: product.assigned_deal_id,
        deal: associatedDeal ? {
          id: associatedDeal.id,
          code: associatedDeal.code,
          description: associatedDeal.description,
          discount_type: associatedDeal.discount_type,
          discount_value: associatedDeal.discount_value,
          minimum_order_amount: associatedDeal.minimum_order_amount,
          maximum_discount_amount: associatedDeal.maximum_discount_amount,
          usage_limit: associatedDeal.usage_limit,
          usage_count: associatedDeal.usage_count,
          expires_at: associatedDeal.expires_at,
          is_active: associatedDeal.is_active,
          created_at: associatedDeal.created_at,
          updated_at: associatedDeal.updated_at,
        } : undefined
      };
    });

    console.log('[fetchProductsWithDeals] 🎉 Successfully mapped products with deals');
    return products;

  } catch (err) {
    console.error('[fetchProductsWithDeals] 💥 Error:', err);
    throw err;
  }
};

// Update your existing fetchProducts to use the new function
export const fetchProducts = fetchProductsWithDeals;

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
    console.log('[updateProduct] 🚀 Starting update for product ID:', id);
    console.log('[updateProduct] 📝 Updates received:', updates);
    
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
      
    if (checkError) {
      console.error('[updateProduct] ❌ Error checking product existence:', checkError);
      throw checkError;
    }
    
    console.log('[updateProduct] ✅ Found existing product:', existingProduct?.name);
    
    let imageUrl = updates.image;
    let isNewImage = false;
    
    if (updates.imageFile) {
      console.log('[updateProduct] 📸 Uploading new image file');
      imageUrl = await uploadProductImage(updates.imageFile);
      isNewImage = true;
      console.log('[updateProduct] ✅ New image URL:', imageUrl);
      
      if (existingProduct?.thumbnail_url && existingProduct.thumbnail_url !== imageUrl) {
        console.log('[updateProduct] 🗑️ Deleting old image:', existingProduct.thumbnail_url);
        await deleteProductImage(existingProduct.thumbnail_url);
      }
    } else {
      console.log('[updateProduct] 📷 No new image file, keeping existing or provided URL');
    }
    
    // 🔥 Build update data with proper typing
    interface UpdateData {
      name?: string;
      description?: string | null;
      unit_price?: number;
      thumbnail_url?: string | null;
      category?: string | null;
      about_url?: string | null;
      clientpathurl?: string | null;
      assigned_deal_id?: string | null;
      updated_at: string;
    }
    
    const updateData: UpdateData = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.title !== undefined) updateData.name = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.price !== undefined) updateData.unit_price = updates.price;
    if (imageUrl !== undefined) updateData.thumbnail_url = imageUrl;
    if (updates.about_url !== undefined) updateData.about_url = updates.about_url;
    if (updates.clientpathurl !== undefined) updateData.clientpathurl = updates.clientpathurl;
    if (updates.deal_id !== undefined) updateData.assigned_deal_id = updates.deal_id; // 🔥 Map deal_id to assigned_deal_id
    
    console.log('[updateProduct] 📋 Final update data:', updateData);
    console.log('[updateProduct] 🔄 Calling Supabase update...');
    
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select(`
        *
      `);
      
    console.log('[updateProduct] 📡 Supabase response received');
    console.log('[updateProduct] 📊 Data:', data);
    console.log('[updateProduct] ❓ Error exists:', !!error);
    
    if (error) {
      console.error('[updateProduct] 🚨 DETAILED ERROR ANALYSIS:');
      console.error('[updateProduct] Error type:', typeof error);
      console.error('[updateProduct] Error instanceof Error:', error instanceof Error);
      console.error('[updateProduct] Error.message:', error?.message);
      console.error('[updateProduct] Error.code:', error?.code);
      console.error('[updateProduct] Error.details:', error?.details);
      console.error('[updateProduct] Error.hint:', error?.hint);
      console.error('[updateProduct] Error keys:', Object.keys(error || {}));
      
      // Try different serialization methods
      try {
        console.error('[updateProduct] JSON.stringify(error):', JSON.stringify(error));
      } catch (jsonErr) {
        console.error('[updateProduct] Could not stringify error:', jsonErr);
      }
      
      // Log each property individually
      if (error && typeof error === 'object') {
        for (const [key, value] of Object.entries(error)) {
          console.error(`[updateProduct] error.${key}:`, value);
        }
      }
      
      if (isNewImage && imageUrl) {
        console.log('[updateProduct] 🧹 Update failed, cleaning up orphaned image');
        await deleteProductImage(imageUrl);
      }
      
      throw new Error(`Database update failed: ${error?.message || 'Unknown error'}`);
    }
    
    if (!data || !data[0]) {
      console.error('[updateProduct] ❌ No data returned from update');
      
      if (isNewImage && imageUrl) {
        console.log('[updateProduct] 🧹 No data returned, cleaning up orphaned image');
        await deleteProductImage(imageUrl);
      }
      
      throw new Error('No data returned from update');
    }
    
    console.log('[updateProduct] ✅ Product updated successfully:', data[0].name);
    
    const result: ProductType = {
      id: data[0].id,
      title: data[0].name,
      price: data[0].unit_price,
      image: data[0].thumbnail_url,
      description: data[0].description,
      category: data[0].category,
      about_url: data[0].about_url,
      clientpathurl: data[0].clientpathurl,
      deal_id: data[0].assigned_deal_id, // 🔥 Map back to deal_id
      deal: data[0].deals
    };
    
    console.log('[updateProduct] 🎉 Returning result:', result);
    return result;
  } catch (err) {
    console.error('[updateProduct] 💥 CAUGHT EXCEPTION:');
    console.error('[updateProduct] Exception type:', typeof err);
    console.error('[updateProduct] Exception message:', err?.message);
    console.error('[updateProduct] Exception stack:', err?.stack);
    console.error('[updateProduct] Full exception:', err);
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

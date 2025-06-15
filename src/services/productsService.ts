import { supabase } from '@/lib/supabaseClient';
import { ProductType } from '@/types/product';
import { Deal } from './dealService';

// Once deals table is created, you can use this:
export const fetchProductsWithDeals = async (): Promise<ProductType[]> => {
  try {
    console.log('[fetchProductsWithDeals] 🚀 Fetching products with deals');
    
    // Fetch products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (productsError) throw productsError;
    if (!productsData) return [];

    // Get deal IDs
    const dealIds = productsData
      .map(p => p.assigned_deal_id)
      .filter(Boolean);

    // Fetch deals if any exist
    let dealsData: Deal[] = [];
    if (dealIds.length > 0) {
      const { data: fetchedDeals } = await supabase
        .from('deals')
        .select('*')
        .in('id', dealIds);
      
      dealsData = fetchedDeals || [];
    }

    // Create deals map
    const dealsMap = new Map<string, Deal>();
    dealsData.forEach(deal => dealsMap.set(deal.id, deal));

    // Map products with deals
    return productsData.map(product => ({
      id: product.id,
      title: product.name,
      price: product.unit_price,
      image: product.thumbnail_url,
      description: product.description,
      category: product.category,
      about_url: product.about_url,
      clientpathurl: product.clientpathurl,
      deal_id: product.assigned_deal_id,
      deal: product.assigned_deal_id ? dealsMap.get(product.assigned_deal_id) : undefined
    }));

  } catch (err) {
    console.error('[fetchProductsWithDeals] Error:', err);
    return [];
  }
};






// Replace your fetchProductsWithDeals with this simplified version:
export const fetchProducts = async (): Promise<ProductType[]> => {
  try {
    console.log('[fetchProducts] 🚀 Fetching products with deal support');
    
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('[fetchProducts] ❌ Error fetching products:', productsError);
      throw productsError;
    }

    if (!productsData || productsData.length === 0) {
      console.log('[fetchProducts] ℹ️ No products found');
      return [];
    }

    console.log('[fetchProducts] ✅ Found', productsData.length, 'products');

    // Get unique deal IDs
    const dealIds = productsData
      .map(product => product.assigned_deal_id)
      .filter(Boolean);

    console.log('[fetchProducts] 🎫 Products with deals:', dealIds.length);

    // Fetch deals if any exist (gracefully handle if deals table doesn't exist)
    let dealsData: Deal[] = [];
    if (dealIds.length > 0) {
      try {
        const { data: fetchedDeals, error: dealsError } = await supabase
          .from('deals')
          .select('*')
          .in('id', dealIds);

        if (dealsError) {
          console.warn('[fetchProducts] ⚠️ Could not fetch deals (table might not exist):', dealsError?.message);
        } else {
          dealsData = fetchedDeals || [];
          console.log('[fetchProducts] ✅ Fetched', dealsData.length, 'deals');
        }
      } catch (dealsException) {
        console.warn('[fetchProducts] ⚠️ Deals table not accessible:', dealsException);
      }
    }

    // Create deals map
    const dealsMap = new Map<string, Deal>();
    dealsData.forEach(deal => dealsMap.set(deal.id, deal));

    // Map products with their deals
    const products: ProductType[] = productsData.map(product => {
      const associatedDeal = product.assigned_deal_id ? dealsMap.get(product.assigned_deal_id) : undefined;
      
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
        deal: associatedDeal
      };
    });

    console.log('[fetchProducts] 🎉 Successfully mapped', products.length, 'products');
    return products;

  } catch (err) {
    console.error('[fetchProducts] 💥 Error:', err);
    return [];
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

export const createProduct = async (
  productData: Omit<ProductType, 'id'> & { imageFile?: File; deal_id?: string }
): Promise<ProductType> => {
  try {
    console.log('[createProduct] 🚀 Starting product creation');
    
    // 🔥 DEBUG: Log the incoming productData in detail
    console.log('[createProduct] � DEBUGGING INCOMING DATA:');
    console.log('[createProduct] productData type:', typeof productData);
    console.log('[createProduct] productData keys:', Object.keys(productData || {}));
    console.log('[createProduct] productData.title:', productData?.title);
    console.log('[createProduct] productData.title type:', typeof productData?.title);
    console.log('[createProduct] productData.title length:', productData?.title?.length);
    console.log('[createProduct] productData.title === null:', productData?.title === null);
    console.log('[createProduct] productData.title === undefined:', productData?.title === undefined);
    console.log('[createProduct] productData.title === "":', productData?.title === '');
    console.log('[createProduct] Full productData:', JSON.stringify(productData, null, 2));

    let imageUrl: string | null = null;
    let uploadedNewImage = false;

    // Handle image upload if provided
    if (productData.imageFile) {
      console.log('[createProduct] 📸 Uploading image file');
      try {
        imageUrl = await uploadProductImage(productData.imageFile);
        uploadedNewImage = true;
        console.log('[createProduct] ✅ Image uploaded successfully:', imageUrl);
      } catch (imageError) {
        console.error('[createProduct] ❌ Image upload failed:', imageError);
        throw new Error(`Image upload failed: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
      }
    } else if (productData.image) {
      imageUrl = productData.image;
      console.log('[createProduct] 📷 Using provided image URL:', imageUrl);
    }

    // 🔥 VALIDATE: Ensure title exists and is not empty
    if (!productData.title || productData.title.trim() === '') {
      console.error('[createProduct] ❌ VALIDATION ERROR: Title is missing or empty');
      console.error('[createProduct] productData.title:', productData.title);
      throw new Error('Product title is required and cannot be empty');
    }

    // 🔥 Build insert data with validation
    const insertData = {
      name: productData.title.trim(), // 🔥 Ensure we trim whitespace
      description: productData.description?.trim() || null,
      unit_price: productData.price,
      thumbnail_url: imageUrl,
      category: productData.category?.trim() || null,
      about_url: productData.about_url?.trim() || null,
      clientpathurl: productData.clientpathurl?.trim() || null,
      assigned_deal_id: productData.deal_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 🔥 DEBUG: Log the insert data
    console.log('[createProduct] � DEBUGGING INSERT DATA:');
    console.log('[createProduct] insertData.name:', insertData.name);
    console.log('[createProduct] insertData.name type:', typeof insertData.name);
    console.log('[createProduct] insertData.name length:', insertData.name?.length);
    console.log('[createProduct] insertData.name === null:', insertData.name === null);
    console.log('[createProduct] insertData.name === undefined:', insertData.name === undefined);
    console.log('[createProduct] Full insertData:', JSON.stringify(insertData, null, 2));

    console.log('[createProduct] 🔄 Calling Supabase insert...');

    const { data, error } = await supabase
      .from('products')
      .insert([insertData])
      .select('*');

    console.log('[createProduct] 📡 Supabase response received');
    console.log('[createProduct] 📊 Data exists:', !!data);
    console.log('[createProduct] 📊 Data length:', data?.length || 0);
    console.log('[createProduct] ❓ Error exists:', !!error);

    if (error) {
      console.error('[createProduct] 🚨 DETAILED ERROR ANALYSIS:');
      console.error('[createProduct] Error type:', typeof error);
      console.error('[createProduct] Error instanceof Error:', error instanceof Error);
      console.error('[createProduct] Error.message:', error?.message);
      console.error('[createProduct] Error.code:', error?.code);
      console.error('[createProduct] Error.details:', error?.details);
      console.error('[createProduct] Error.hint:', error?.hint);
      console.error('[createProduct] Error keys:', Object.keys(error || {}));
      
      // Try different serialization methods
      try {
        console.error('[createProduct] JSON.stringify(error):', JSON.stringify(error));
      } catch (jsonErr) {
        console.error('[createProduct] Could not stringify error:', jsonErr);
      }
      
      // Log each property individually
      if (error && typeof error === 'object') {
        for (const [key, value] of Object.entries(error)) {
          console.error(`[createProduct] error.${key}:`, value);
        }
      }
      
      // Clean up uploaded image if product creation failed
      if (uploadedNewImage && imageUrl) {
        console.log('[createProduct] 🧹 Product creation failed, deleting orphaned image');
        try {
          await deleteProductImage(imageUrl);
          console.log('[createProduct] ✅ Orphaned image deleted');
        } catch (deleteError) {
          console.error('[createProduct] ⚠️ Failed to delete orphaned image:', deleteError);
        }
      }
      
      throw new Error(`Product creation failed: ${error?.message || 'Unknown database error'}`);
    }

    if (!data || !data[0]) {
      console.error('[createProduct] ❌ No data returned from insert');
      
      if (uploadedNewImage && imageUrl) {
        console.log('[createProduct] 🧹 No data returned, cleaning up orphaned image');
        try {
          await deleteProductImage(imageUrl);
        } catch (deleteError) {
          console.error('[createProduct] ⚠️ Failed to delete orphaned image:', deleteError);
        }
      }
      
      throw new Error('No data returned from product creation');
    }

    console.log('[createProduct] ✅ Product created successfully:', data[0].name);

    // 🔥 Fetch the deal information if assigned
    let dealInfo: Deal | undefined = undefined;
    if (data[0].assigned_deal_id) {
      console.log('[createProduct] 🎫 Fetching deal information for:', data[0].assigned_deal_id);
      try {
        const { data: dealData, error: dealError } = await supabase
          .from('deals')
          .select('*')
          .eq('id', data[0].assigned_deal_id)
          .single();

        if (dealError) {
          console.warn('[createProduct] ⚠️ Could not fetch deal info:', dealError?.message);
        } else if (dealData) {
          dealInfo = dealData as Deal;
          console.log('[createProduct] ✅ Deal info fetched:', dealInfo.code);
        }
      } catch (dealFetchError) {
        console.warn('[createProduct] ⚠️ Exception fetching deal:', dealFetchError);
      }
    }

    // Map the response back to ProductType
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
      deal: dealInfo // Include deal information
    };

    console.log('[createProduct] 🎉 Returning result with deal info:', {
      productName: result.title,
      dealCode: result.deal?.code || 'No deal'
    });

    return result;
  } catch (err) {
    console.error('[createProduct] 💥 CAUGHT EXCEPTION:');
    console.error('[createProduct] Exception type:', typeof err);
    // console.error('[createProduct] Exception message:', err?.message);
    // console.error('[createProduct] Exception stack:', err?.stack);
    console.error('[createProduct] Full exception:', err);
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
  } catch (err ) {
 
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


// Add this function to test your database setup
export const checkDatabaseTables = async () => {
  console.log('🔍 Checking database tables...');
  
  // Check products table
  try {
    const { data: productsTest, error: productsError } = await supabase
      .from('products')
      .select('id, name, assigned_deal_id')
      .limit(1);
      
    console.log('📊 Products table test:', {
      hasData: !!productsTest,
      dataLength: productsTest?.length || 0,
      hasError: !!productsError,
      errorMessage: productsError?.message
    });
    
    if (productsTest && productsTest.length > 0) {
      console.log('📋 Sample product:', productsTest[0]);
    }
  } catch (err) {
    console.error('❌ Products table test failed:', err);
  }
  
  // Check deals table
  try {
    const { data: dealsTest, error: dealsError } = await supabase
      .from('deals')
      .select('id, code, description')
      .limit(1);
      
    console.log('📊 Deals table test:', {
      hasData: !!dealsTest,
      dataLength: dealsTest?.length || 0,
      hasError: !!dealsError,
      errorMessage: dealsError?.message
    });
    
    if (dealsTest && dealsTest.length > 0) {
      console.log('📋 Sample deal:', dealsTest[0]);
    }
  } catch (err) {
    console.error('❌ Deals table test failed:', err);
  }
};

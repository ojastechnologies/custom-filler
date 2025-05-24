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
  category?: string;
  about_url?: string;
}): Promise<ProductType> => {
  try {
    let imageUrl = product.thumbnail_url;
    if (product.imageFile) {
      imageUrl = await uploadProductImage(product.imageFile);
    }
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name: product.name,
          description: product.description,
          unit_price: product.unit_price,
          thumbnail_url: imageUrl,
          category: product.category,
          about_url: product.about_url,
        },
      ])
      .select();
    if (error) throw error;
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
    throw err;
  }
};

export const updateProduct = async (
  id: string,
  updates: Partial<Omit<ProductType, 'id'>>
): Promise<ProductType> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
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
    throw err;
  }
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    throw err;
  }
};

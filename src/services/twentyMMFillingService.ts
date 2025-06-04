import { supabase } from '@/lib/supabaseClient';

export const fetchTwentyMMFillingContent = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('twenty_mm_filling_content')
    .select('content')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data?.content || '';
};

export const updateTwentyMMFillingContent = async (content: string): Promise<void> => {
  const { error } = await supabase
    .from('twenty_mm_filling_content')
    .update({ content, updated_at: new Date() })
    .order('updated_at', { ascending: false })
    .limit(1)
    .select();
  if (error) throw error;
};
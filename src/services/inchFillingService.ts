import { supabase } from '@/lib/supabaseClient';

export const fetchInchFillingContent = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('inch_filling_content')
    .select('content')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data?.content || '';
};

export const updateInchFillingContent = async (content: string): Promise<void> => {
  const { error } = await supabase
    .from('inch_filling_content')
    .update({ content, updated_at: new Date() })
    .order('updated_at', { ascending: false })
    .limit(1)
    .select();
  if (error) throw error;
};
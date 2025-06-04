import { supabase } from '@/lib/supabaseClient';

export const fetchNonFlammablePropellantContent = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('non_flammable_propellant_content')
    .select('content')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data?.content || '';
};

export const updateNonFlammablePropellantContent = async (content: string): Promise<void> => {
  const { error } = await supabase
    .from('non_flammable_propellant_content')
    .update({ content, updated_at: new Date() })
    .order('updated_at', { ascending: false })
    .limit(1)
    .select();
  if (error) throw error;
};
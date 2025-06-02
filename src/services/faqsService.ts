import { supabase } from '@/lib/supabaseClient';

export type FAQ = {
  id: string;
  question: string;
  answer: string;
};

export const fetchFaqs = async (): Promise<FAQ[]> => {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const updateFaq = async (id: string, question: string, answer: string) => {
  const { error } = await supabase
    .from('faqs')
    .update({ question, answer, updated_at: new Date() })
    .eq('id', id);
  if (error) throw error;
};

export const addFaq = async (question: string, answer: string) => {
  const { error } = await supabase
    .from('faqs')
    .insert([{ question, answer }]);
  if (error) throw error;
};

export const deleteFaq = async (id: string) => {
  const { error } = await supabase
    .from('faqs')
    .delete()
    .eq('id', id);
  if (error) throw error;
};
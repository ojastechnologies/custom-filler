import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    storageKey: 'supabase.auth.token',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

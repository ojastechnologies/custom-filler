import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vrfpayooyasvetbxkjam.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZnBheW9veWFzdmV0YnhramFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTIzODUsImV4cCI6MjA2MjA4ODM4NX0.HQVZ1H0wjFLILScEo0JhZIt7dPQ-f5QHEUePMvubn3o";

export const supabase = createClient(supabaseUrl, supabaseKey);

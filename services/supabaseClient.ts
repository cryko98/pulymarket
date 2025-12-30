
import { createClient } from '@supabase/supabase-js';

// Próbáljuk elérni a változókat többféleképpen (Vite, Node, vagy globális process)
const getEnv = (key: string) => {
  // @ts-ignore
  const env = (import.meta as any).env?.[key] || (process as any).env?.[key] || (window as any).process?.env?.[key];
  return env || '';
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

// Debug log a fejlesztői konzolhoz (csak ha nincs beállítva)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase configuration missing! The app is running in LOCAL DEMO MODE. Please check your environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export const isSupabaseConfigured = () => !!supabase;

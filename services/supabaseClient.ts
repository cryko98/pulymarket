import { createClient } from '@supabase/supabase-js';

// A "valós" működéshez (hogy ne Demo módban legyen) a Vercel-en vagy a .env fájlban
// be kell állítanod a következő környezeti változókat a Supabase adataiddal.
// Ha nincs beállítva környezeti változó, akkor üres marad, és a Demo mód fut.
// 
// Vercel beállítás: Settings -> Environment Variables
// VITE_SUPABASE_URL = https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5c...

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || ''; 
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export const isSupabaseConfigured = () => !!supabase;
// src/lib/supabase.ts — Supabase client for frontend auth

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '[ASCEND] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env — ' +
        'Supabase features will be unavailable. Copy .env.example to .env and fill in values.'
    );
} else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };


import { createClient } from '@supabase/supabase-js';

/**
 * Creates a singleton Supabase client instance using environment variables.
 * The anonymous key should be safe to expose in the client code.  Do not use
 * the service role key here.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
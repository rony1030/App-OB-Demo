import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { getSupabaseConfig } from './config';

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}

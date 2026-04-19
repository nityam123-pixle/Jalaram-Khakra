import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase-env"

/** Service role client — bypasses RLS. Only construct on the server (API routes). */
export function createSupabaseServiceClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Anon server client (same as browser) — respects RLS. */
export function createSupabaseAnonServerClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

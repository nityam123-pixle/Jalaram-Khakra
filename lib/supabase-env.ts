/** Public Supabase URL (same project as Table Editor). Override via NEXT_PUBLIC_SUPABASE_URL if ref differs. */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://gpynpjedcwbbpkyyuvga.supabase.co"

/** Anon key — must match the project above or reads will hit an empty/wrong DB. */
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweW5wamVkY3diYnBreXl1dmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODYxMjIsImV4cCI6MjA2NjI2MjEyMn0.RwPy2ttONchySm3eaVgmhOsMd5eT1SKGOThRevDMJ2k"

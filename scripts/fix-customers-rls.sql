-- =============================================
-- Fix: app shows 0 customers while Table Editor shows rows
-- Cause: Row Level Security (RLS) blocks the anon key with no policy.
-- Run in Supabase → SQL Editor (same project as your data).
-- =============================================

-- Allow read for anonymous + authenticated clients (same as typical orders apps)
DROP POLICY IF EXISTS "customers_select_anon" ON public.customers;
CREATE POLICY "customers_select_anon"
  ON public.customers
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow insert/update from the app (adjust if you add auth later)
DROP POLICY IF EXISTS "customers_insert_anon" ON public.customers;
CREATE POLICY "customers_insert_anon"
  ON public.customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "customers_update_anon" ON public.customers;
CREATE POLICY "customers_update_anon"
  ON public.customers
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is on (policies above still apply)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Optional: bypass RLS only on the server by setting
-- SUPABASE_SERVICE_ROLE_KEY in .env (never expose in client).
-- =============================================

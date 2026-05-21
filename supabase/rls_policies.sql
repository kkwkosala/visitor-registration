-- ============================================================
-- rls_policies.sql
-- Run this in Supabase SQL Editor SECOND (after schema)
-- ============================================================

-- Enable RLS on all application tables
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES policies
-- ============================================================

-- Users can only read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- No direct INSERT/UPDATE on profiles from the client
-- Profile creation is handled by the trigger (SECURITY DEFINER)

-- ============================================================
-- VISIT REQUESTS policies
-- ============================================================

-- SELECT: visitors see own rows; admins see all rows
DROP POLICY IF EXISTS "requests_select" ON public.visit_requests;
CREATE POLICY "requests_select"
  ON public.visit_requests FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- INSERT: visitors only; user_id must match authenticated user
DROP POLICY IF EXISTS "requests_insert_visitor" ON public.visit_requests;
CREATE POLICY "requests_insert_visitor"
  ON public.visit_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- UPDATE (visitor): own pending rows only; cannot change status
DROP POLICY IF EXISTS "requests_update_visitor" ON public.visit_requests;
CREATE POLICY "requests_update_visitor"
  ON public.visit_requests FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status = 'pending'
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'  -- visitor cannot escalate status
  );

-- UPDATE (admin): can update status + comment on any row
DROP POLICY IF EXISTS "requests_update_admin" ON public.visit_requests;
CREATE POLICY "requests_update_admin"
  ON public.visit_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- DELETE: visitors can only delete their own pending rows
DROP POLICY IF EXISTS "requests_delete_visitor" ON public.visit_requests;
CREATE POLICY "requests_delete_visitor"
  ON public.visit_requests FOR DELETE
  USING (
    auth.uid() = user_id
    AND status = 'pending'
  );

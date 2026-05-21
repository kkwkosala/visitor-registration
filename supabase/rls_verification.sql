-- =============================================================
-- VIS-009: RLS Policy Verification Script
-- Run in Supabase SQL Editor (as postgres / service_role)
-- =============================================================
-- These assertions document expected behaviour.
-- PASS = query returns 0 rows (no violation).
-- FAIL = query returns >0 rows (policy gap found).
-- =============================================================

-- ----------------------------------------------------------------
-- 1. SETUP: Create two test users and one admin
--    Replace UUIDs with real auth.users IDs from your Supabase project.
-- ----------------------------------------------------------------

-- Simulated via policy checks below using set_config + RLS evaluation.
-- In Supabase you can test RLS directly via the "RLS debugger" in the
-- SQL editor: use `set local role authenticated;`
--              and `set local request.jwt.claims = '{"sub":"<user_id>"}'`

-- ----------------------------------------------------------------
-- 2. ASSERTION: Visitor cannot see another user's request
-- ----------------------------------------------------------------
-- Expected: 0 rows returned when visitor_user_id queries request
-- owned by other_user_id (RLS filters it out).

-- Run as visitor_user_id:
-- SET LOCAL role = authenticated;
-- SET LOCAL request.jwt.claims = '{"sub":"<visitor_user_id>", "role":"authenticated"}';
-- SELECT count(*) FROM visit_requests WHERE user_id = '<other_user_id>';
-- Expected result: 0

-- ----------------------------------------------------------------
-- 3. ASSERTION: Visitor cannot UPDATE an approved request
-- ----------------------------------------------------------------
-- The WITH CHECK (status = 'pending') on visitor UPDATE policy
-- blocks any UPDATE where target row has status != 'pending'.

-- Run as visitor_user_id (who owns req_id):
-- UPDATE visit_requests
--   SET visitor_name = 'Hacker'
-- WHERE id = '<approved_req_id>';
-- Expected result: ERROR 42501 (row-level security violation)

-- ----------------------------------------------------------------
-- 4. ASSERTION: Visitor cannot escalate their own status
-- ----------------------------------------------------------------
-- Visitor UPDATE policy: WITH CHECK (status = 'pending')
-- Prevents setting status = 'approved' on own row.

-- UPDATE visit_requests
--   SET status = 'approved'
-- WHERE id = '<own_pending_req_id>';
-- Expected result: ERROR 42501

-- ----------------------------------------------------------------
-- 5. ASSERTION: Admin sees ALL requests
-- ----------------------------------------------------------------
-- SELECT count(*) FROM visit_requests;
-- Run as admin_user_id (role = 'admin' in profiles table)
-- Expected result: count = total rows in table

-- ----------------------------------------------------------------
-- 6. ASSERTION: Admin can update status to approved/rejected
-- ----------------------------------------------------------------
-- UPDATE visit_requests
--   SET status = 'approved', admin_comment = 'Welcome!'
-- WHERE id = '<any_req_id>';
-- Expected result: 1 row updated

-- ----------------------------------------------------------------
-- 7. ASSERTION: Unauthenticated user sees no requests
-- ----------------------------------------------------------------
-- SET LOCAL role = anon;
-- SELECT count(*) FROM visit_requests;
-- Expected result: 0 (RLS blocks anon by default)

-- ----------------------------------------------------------------
-- 8. Live smoke test: Check RLS is ENABLED on both tables
-- ----------------------------------------------------------------
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'visit_requests');

-- Expected output:
-- tablename        | rls_enabled
-- visit_requests   | true
-- profiles         | true

-- ----------------------------------------------------------------
-- 9. List all active RLS policies
-- ----------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual AS using_expr,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ----------------------------------------------------------------
-- 10. Verify index coverage for common query patterns
-- ----------------------------------------------------------------
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Expected indexes:
-- visit_requests_user_id_idx     — speeds up visitor SELECT
-- visit_requests_status_idx      — speeds up admin filter by status
-- visit_requests_visit_date_idx  — speeds up date range queries

-- ============================================================
-- seed.sql
-- Run this in Supabase SQL Editor THIRD (after RLS policies)
-- ============================================================
-- This seeds an admin user profile.
-- The admin must FIRST sign up via magic link using admin@company.com
-- Then run this script to elevate the role to 'admin'.
-- ============================================================

-- Elevate the admin user's role (run after admin signs in for the first time)
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@company.com';

-- ============================================================
-- Synthetic visitor test data (optional — for demo purposes)
-- Replace <visitor-user-id> with an actual UUID from your profiles table
-- ============================================================

-- INSERT INTO public.visit_requests
--   (user_id, visitor_name, email, purpose, visit_date, status, admin_comment)
-- VALUES
--   ('<visitor-user-id>', 'Alice Johnson',   'alice@example.com',  'Interview for Software Engineer role', CURRENT_DATE + 1, 'pending',  NULL),
--   ('<visitor-user-id>', 'Bob Smith',        'bob@example.com',    'Client meeting with Product team',      CURRENT_DATE + 2, 'approved', 'Welcome! Please report to reception.'),
--   ('<visitor-user-id>', 'Carol White',      'carol@example.com',  'Office tour for potential investor',    CURRENT_DATE + 3, 'rejected', 'Rescheduled — please resubmit for next week.'),
--   ('<visitor-user-id>', 'David Chen',       'david@example.com',  'Technical workshop attendance',         CURRENT_DATE + 4, 'pending',  NULL);

-- ============================================================
-- Verify setup
-- ============================================================
SELECT id, email, role FROM public.profiles;

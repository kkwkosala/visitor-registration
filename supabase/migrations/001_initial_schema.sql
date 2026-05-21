-- ============================================================
-- 001_initial_schema.sql
-- Run this in Supabase SQL Editor FIRST
-- ============================================================

-- PROFILES: one row per auth user, auto-created by trigger
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'visitor'
              CHECK (role IN ('visitor', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- VISIT REQUESTS: one row per visitor request
CREATE TABLE IF NOT EXISTS public.visit_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visitor_name   TEXT NOT NULL CHECK (char_length(visitor_name) <= 100),
  email          TEXT NOT NULL CHECK (char_length(email) <= 254),
  purpose        TEXT NOT NULL CHECK (char_length(purpose) <= 500),
  visit_date     DATE NOT NULL CHECK (visit_date >= CURRENT_DATE),
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_comment  TEXT CHECK (admin_comment IS NULL OR char_length(admin_comment) <= 1000),
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TRIGGER: auto-create profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- TRIGGER: auto-update updated_at on visit_requests
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS visit_requests_set_updated_at ON public.visit_requests;
CREATE TRIGGER visit_requests_set_updated_at
  BEFORE UPDATE ON public.visit_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- INDEXES for common query patterns
CREATE INDEX IF NOT EXISTS idx_visit_requests_user_id
  ON public.visit_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_visit_requests_status
  ON public.visit_requests(status);

CREATE INDEX IF NOT EXISTS idx_visit_requests_status_date
  ON public.visit_requests(status, visit_date DESC);

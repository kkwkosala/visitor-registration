# /rls-verify — RLS Policy Verification Command

Verifies Supabase Row Level Security policies against expected behaviour.

## Usage
```
/rls-verify                 # show all policies and expected state
/rls-verify <table>         # verify policies for specific table
```

## What this command does

Reads `supabase/rls_verification.sql` and guides you through running each assertion
in the Supabase SQL Editor, then interprets the results.

## Quick verification steps

**Step 1 — Check RLS is enabled:**
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('profiles', 'visit_requests');
```
Expected: both `rowsecurity = true`

**Step 2 — List active policies:**
```sql
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';
```
Expected policies:
- `visit_requests`: 5 policies (visitor select, insert, update, delete + admin select + admin update)
- `profiles`: 2 policies (user select own, user update own)

**Step 3 — Check visitor cannot see other users:**
```sql
-- Run as visitor user (set JWT in Supabase auth settings)
SELECT count(*) FROM visit_requests WHERE user_id != auth.uid();
```
Expected: `0`

**Step 4 — Check visitor cannot escalate status:**
```sql
-- Should return ERROR 42501:
UPDATE visit_requests SET status = 'approved' WHERE user_id = auth.uid();
```
Expected: RLS violation error

## Cross-reference
Full assertion list: `supabase/rls_verification.sql`
Security checklist: `docs/security-checklist.md`

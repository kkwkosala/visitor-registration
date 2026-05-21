# Security Checklist — Visitor Registration System

## ✅ Authentication
- [x] All routes except `/login` and `/auth/callback` require authenticated session
- [x] Supabase magic link — no passwords stored in application code or DB
- [x] Session persisted via Supabase JS client (localStorage — acceptable for demo)
- [x] `AuthGuard` blocks unauthenticated users and redirects to `/login`
- [x] Auth callback route processes magic link token via Supabase client
- [ ] Recommended: set JWT expiry to 1 hour in Supabase project settings (default: 1 week)

## ✅ Authorization
- [x] `RoleGuard` prevents visitors from accessing `/admin/*` routes
- [x] `RoleGuard` prevents admins from accessing `/visitor/*` routes
- [x] Role is read from `profiles.role` in the database — not from a client-controlled claim
- [x] Even if client guards are bypassed, RLS prevents any data access
- [x] Admins cannot be self-promoted via the frontend (no `UPDATE profiles` policy for users)

## ✅ Row Level Security (RLS)
- [x] RLS **enabled** on `profiles` table
- [x] RLS **enabled** on `visit_requests` table
- [x] Visitors SELECT: only rows where `auth.uid() = user_id`
- [x] Visitors INSERT: `WITH CHECK (auth.uid() = user_id)` — cannot forge ownership
- [x] Visitors UPDATE: only own pending rows; `WITH CHECK (status = 'pending')` — cannot escalate status
- [x] Visitors DELETE: only own pending rows
- [x] Admins SELECT: all rows (via `EXISTS` subquery on `profiles.role = 'admin'`)
- [x] Admins UPDATE: can set status + admin_comment on any row
- [x] Default: no policy = no access (Supabase deny-by-default when RLS is enabled)
- [ ] Verify: run cross-user access test with two different visitor accounts

## ✅ Ownership Validation
- [x] `visit_requests.user_id` enforced by RLS `WITH CHECK` — client cannot forge a different user_id
- [x] Visitor accessing another user's request via URL → RLS returns 0 rows → Angular shows "Not found"
- [x] Status transitions enforced server-side (visitor cannot change status field via UPDATE policy)

## ✅ Input Validation
- [x] `visitor_name`: required, max 100 chars (client + DB CHECK constraint)
- [x] `email`: required, valid email format (client + DB constraint)
- [x] `purpose`: required, max 500 chars (client + DB CHECK constraint)
- [x] `visit_date`: required, must be today or future (client validation + DB CHECK `visit_date >= CURRENT_DATE`)
- [x] `admin_comment`: optional, max 1000 chars (DB CHECK constraint)
- [x] All validation errors shown inline before form submit
- [x] Submit button disabled during loading (prevents double-submit)

## ✅ Environment Variables & Secrets
- [x] `.env` in `.gitignore`
- [x] `.env.example` committed with placeholder values only
- [x] No API keys hardcoded in source code
- [x] Only Supabase `anon` key used in frontend (this key is designed to be public)
- [x] Supabase `service_role` key is **never** used in the frontend
- [ ] Rotate anon key immediately if accidentally committed

## ✅ Dependency Security
- [ ] Run `npm audit` before demo
- [x] Minimal dependency set — only `@supabase/supabase-js` added beyond Angular defaults
- [ ] Pin `@supabase/supabase-js` to exact version in package.json before production

## ✅ Data Privacy
- [x] Only synthetic test data used during hackathon
- [x] No real PII collected
- [x] No payment processing

## ⚠️ Known Limitations (Acceptable for Hackathon)
- Session stored in `localStorage` — XSS risk in production; mitigated by Supabase's secure cookie option
- No rate limiting on request submission — acceptable at demo scale
- No email notifications to visitors on status change — UI-only status display
- No audit log table for admin actions — structured console logging added as observability stub
- DB CHECK `visit_date >= CURRENT_DATE` evaluated at INSERT time — does not prevent historical dates added before the day rolls over

# /security-check — AI Security Review Command

Runs a targeted security review of the application, focusing on auth, RLS, and data ownership.

## Usage
```
/security-check             # full project security review
/security-check rls         # RLS policies only
/security-check auth        # authentication flow only
/security-check <file>      # single file review
```

## What AI checks

### Authentication
- Magic link flow completeness (no bypass paths)
- Session restoration on cold load (loading signal race condition)
- Callback timeout handling
- Sign-out clears all local state

### Authorization (Client)
- `authGuard` and `roleGuard` are async (await loading signal)
- Role redirect logic is correct for both visitor and admin
- No role stored in localStorage (profile fetched from DB)

### Authorization (Server — RLS)
Runs queries against `supabase/rls_policies.sql`:
- Visitor SELECT policy: `USING (user_id = auth.uid())`
- Visitor UPDATE policy: `WITH CHECK (status = 'pending')`
- Admin policy uses subquery on `profiles` — not JWT claims
- Anon access blocked (no anon policy = default deny)

Reference verification script: `supabase/rls_verification.sql`

### Input Validation
- Every form field has Angular validators
- Date fields use `minDateValidator` (no past dates)
- Email fields use `Validators.email`
- Length limits on text fields

### Data Exposure
- No sensitive fields returned that aren't needed
- `user_id` not editable by visitor
- `status` not settable by visitor (RLS `WITH CHECK`)
- Admin comment writeable only by admin

### Environment / Secrets
- No hardcoded Supabase keys
- `environment.ts` uses placeholder values
- `.env` in `.gitignore`
- `environment.prod.ts` uses placeholders

## Output Format

Generates a report against `docs/security-checklist.md` with:
- ✅ PASS / ❌ FAIL / ⚠️ REVIEW for each item
- Remediation steps for any failures
- Updated risk level assessment

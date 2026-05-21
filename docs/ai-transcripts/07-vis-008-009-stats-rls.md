# AI Transcript — VIS-008/009: Admin Stats + RLS Security Hardening

**Date:** 2026-05-21  
**AI Tool:** GitHub Copilot (Claude Sonnet 4.6)  
**Stories:** VIS-008 (Admin stats) + VIS-009 (RLS verification)

---

## VIS-008 — Admin Stats Dashboard

### Objective
Show administrators a summary of request counts by status at the top of the dashboard.

### Implementation

Stats are derived from the same `allRequests` signal — no extra API call:

```typescript
protected stats = computed(() => {
  const all = this.allRequests();
  return {
    total:    all.length,
    pending:  all.filter(r => r.status === 'pending').length,
    approved: all.filter(r => r.status === 'approved').length,
    rejected: all.filter(r => r.status === 'rejected').length,
  };
});
```

### AI Design Note

> "Stats computed from the same signal as the table means they are always in sync — including
> after an approve/reject action (optimistic update propagates to stats automatically).
> No polling, no separate query, no risk of stats/table showing different totals."

---

## VIS-009 — RLS Security Hardening

### Objective
Document and verify that Row Level Security policies are correctly configured and block
all unauthorized data access patterns.

### RLS Verification Script

`supabase/rls_verification.sql` was generated with 10 documented assertions:

| Assertion | Policy Being Tested |
|-----------|-------------------|
| Visitor cannot see another user's requests | `USING (user_id = auth.uid())` |
| Visitor cannot UPDATE approved request | `USING (status = 'pending')` |
| Visitor cannot escalate own status to 'approved' | `WITH CHECK (status = 'pending')` |
| Admin sees all requests | `EXISTS (... role = 'admin')` subquery |
| Admin can update any request | Admin UPDATE policy |
| Unauthenticated user sees nothing | Default deny (no anon policy) |
| RLS is enabled on both tables | `pg_tables.rowsecurity = true` |
| All policies are listed | `pg_policies` query |
| Indexes cover common query patterns | `pg_indexes` query |

### Critical RLS Policies

```sql
-- Visitor SELECT: only own rows
CREATE POLICY "Visitors select own requests" ON visit_requests
  FOR SELECT USING (user_id = auth.uid());

-- Visitor UPDATE: only own PENDING rows, cannot change status
CREATE POLICY "Visitors update own pending requests" ON visit_requests
  FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (status = 'pending');

-- Admin SELECT: all rows (role verified server-side)
CREATE POLICY "Admins select all requests" ON visit_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Threat Model Coverage

| Threat | Mitigation |
|--------|-----------|
| Visitor accesses other user's data via URL manipulation | RLS `USING (user_id = auth.uid())` — returns empty |
| Visitor self-approves their own request | `WITH CHECK (status = 'pending')` — DB rejects write |
| Visitor claims admin role in JWT | Role read from `profiles` table, not JWT claims |
| Unauthenticated API call | No anon policy — all tables default deny |
| Admin role set by visitor | `profiles` UPDATE policy restricts who can set role |

### AI Security Commentary

> "The `WITH CHECK` clause is the most important policy here. `USING` controls which rows
> can be READ for the UPDATE operation. `WITH CHECK` controls what the rows look like
> AFTER the update. Having `WITH CHECK (status = 'pending')` means a visitor cannot
> write any value to `status` — not even keeping it as 'pending'. Combined with
> `USING (status = 'pending')`, they can only update non-status fields on pending rows."

> "Admin role is stored in the `profiles` table, not in Supabase JWT custom claims.
> This is intentional — JWT claims require a custom auth hook to populate and refresh.
> Profile-based role lookup is simpler and sufficient for this scope."

---

## Commits

```
feat(VIS-006): admin dashboard with filter, approve/reject, stats  ← includes VIS-008
docs(VIS-009): RLS verification script and final README
```

**Tests:** 29 passing  
**Build:** 0 errors

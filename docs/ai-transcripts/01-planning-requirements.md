# AI Transcript — STEP 1–5: Planning, Requirements & Architecture

**Date:** 2026-05-21  
**AI Tool:** GitHub Copilot (Claude Sonnet 4.6)  
**Phase:** Pre-development planning

---

## Prompt

> "You are acting as my AI product analyst, architect, senior Angular engineer, DevOps engineer, reviewer, and AI SDLC collaborator. I am participating in a one-day AI-driven SDLC hackathon exercise…"
> *(Full project brief provided — Visitor Registration System)*

---

## STEP 1 — Requirement Analysis

**AI identified the following that were NOT in the original brief:**

### Assumptions
- Single-tenant application (one organisation, one office)
- Magic link is the only authentication method (no password)
- Admin accounts are pre-provisioned — visitors cannot self-assign admin role
- Visit date is a calendar date only (no time slot booking)
- Email field on request may differ from the logged-in email (visitor registering on behalf)

### Hidden Requirements
- Profile must be auto-created on first sign-in (trigger required)
- Loading states needed on every async operation
- Empty states needed for all list views
- Redirect loop prevention: guards must wait for session to restore before redirecting
- Visitors must not be able to access other users' requests via direct URL

### Risks Identified
- Magic link email delivery delay (user experience risk)
- RLS misconfiguration could expose all requests to visitors
- Admin role stored in `profiles` table — must not be settable by visitors via API
- No email verification for visitor name/email fields — synthetic data acceptable for hackathon
- Angular route guards are client-side only — RLS is the real security boundary

### Non-Functional Requirements
- App must start in < 5 minutes from clone
- State must persist after browser refresh
- No secrets committed to repository
- Must use `.env.example` pattern

### Edge Cases
1. Visitor submits request with past date → blocked by `minDateValidator` + DB CHECK constraint
2. Visitor attempts to edit approved request → form detects non-pending status and shows error
3. Visitor guesses another user's request UUID in URL → RLS returns empty, component shows error
4. Admin approves already-approved request → idempotent (no harm, status stays approved)
5. Magic link expires before click → Supabase returns error, AuthCallbackComponent handles gracefully
6. User signs in on a device without prior session → `authGuard` waits for `loading` signal before redirect
7. Admin role revoked mid-session → next API call returns 403, handled by service error state
8. Concurrent delete requests → Supabase handles optimistically, last write wins
9. Empty purpose field submitted → `Validators.required` blocks form submission
10. Visit date today vs future → `minDateValidator` uses `new Date()` at validation time

---

## STEP 2 — GitHub Project Management

**AI generated the following issue hierarchy:**

### Epic
- `VIS-000` — Visitor Registration System (parent epic)

### User Stories
| ID | Title | Role |
|----|-------|------|
| VIS-001 | Project Scaffold | DevOps |
| VIS-002 | Authentication (Magic Link) | Visitor + Admin |
| VIS-003 | Submit Visit Request | Visitor |
| VIS-004 | Visitor Dashboard | Visitor |
| VIS-005 | Edit/Delete Pending Request | Visitor |
| VIS-006 | Admin Request List + Filter | Admin |
| VIS-007 | Approve/Reject with Comment | Admin |
| VIS-008 | Admin Stats Dashboard | Admin |
| VIS-009 | RLS Security Hardening | Security |
| VIS-010 | Final Documentation | Documentation |

### Branch Naming Convention
```
feature/VIS-001-scaffold
feature/VIS-002-auth
feature/VIS-003-request-form
fix/VIS-XXX-description
```

### Commit Convention
```
feat(VIS-001): description
fix(VIS-003): description
docs(VIS-010): description
test(VIS-004): description
```

---

## STEP 3 — Architecture

**AI generated the following architecture decisions:**

### Technology Stack
- **Frontend:** Angular 21 (standalone components, signals, vitest)
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Auth:** Magic link (no passwords)
- **State:** Angular Signals (no NgRx — too heavy for scope)
- **Routing:** Lazy-loaded feature modules

### Component Diagram
```
Browser
  └── Angular SPA (localhost:4200)
        ├── AuthService (signals: session, profile, loading)
        ├── authGuard → waits for loading signal
        ├── roleGuard → redirects by role
        └── Features (lazy-loaded)
              ├── /login           → LoginComponent
              ├── /auth/callback   → AuthCallbackComponent
              ├── /visitor/*       → VisitorLayoutComponent
              │     ├── /dashboard → VisitorDashboardComponent
              │     ├── /requests/new → VisitRequestFormComponent
              │     └── /requests/:id/edit → VisitRequestFormComponent
              └── /admin/*         → AdminLayoutComponent
                    └── /dashboard → AdminDashboardComponent

Supabase (cloud)
  ├── auth.users (managed by Supabase Auth)
  ├── profiles (role: visitor | admin)
  └── visit_requests (RLS enforced)
```

### Authentication Flow
```
1. User enters email → sendMagicLink()
2. Supabase sends magic link email
3. User clicks link → redirected to /auth/callback
4. Supabase exchanges token → session established
5. AuthService.loadProfile() → fetches role from profiles table
6. AuthCallbackComponent watches role signal → redirects to correct dashboard
```

### RLS Strategy
- **Visitors:** SELECT/INSERT/UPDATE/DELETE own rows only (`user_id = auth.uid()`)
- **Visitor UPDATE:** `WITH CHECK (status = 'pending')` — cannot escalate status
- **Admins:** SELECT all rows, UPDATE all rows (role checked via subquery on profiles)
- **Unauthenticated:** No access (default deny)

---

## STEP 4 — Repository Structure

```
visitor-registration/
├── .github/
│   ├── workflows/ci.yml
│   └── ISSUE_TEMPLATE/
├── docs/
│   ├── ADR.md
│   ├── ai-transcripts/
│   ├── scalability.md
│   └── security-checklist.md
├── frontend/           ← Angular 21 app
│   └── src/app/
│       ├── core/       ← services, guards, models
│       ├── shared/     ← reusable components
│       └── features/   ← auth | visitor | admin
├── supabase/
│   ├── migrations/
│   ├── rls_policies.sql
│   └── seed.sql
└── README.md
```

---

## STEP 5 — Development Roadmap

| Phase | Stories | Objective |
|-------|---------|-----------|
| Phase 1 | VIS-001 | Scaffold: project, environments, auth service, guards, CI |
| Phase 2 | VIS-002 | Auth: login page, callback, navbar |
| Phase 3 | VIS-003, VIS-004, VIS-005 | Visitor flows: form, dashboard, edit/delete |
| Phase 4 | VIS-006, VIS-007, VIS-008 | Admin flows: list, actions, stats |
| Phase 5 | VIS-009, VIS-010 | Security hardening, RLS verification, final docs |

**Exit criteria per phase:** 0 build errors + all tests passing before moving to next phase.

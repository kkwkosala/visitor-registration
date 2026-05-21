# Planning Notes — Visitor Registration System

**Hackathon:** Embla AI SDLC Exercise — 2026-05-21  
**AI Tool:** GitHub Copilot (Claude Sonnet 4.6)  
**Duration:** One day (9:00 – 12:30)

---

## Problem Statement

Office visitors need a structured way to register visit requests, and reception/admin staff
need to approve or reject them with an optional comment. The current process is ad-hoc
(phone calls, emails), causing missed visits and no audit trail.

---

## AI-Assisted Decomposition

The full specification was provided to the AI as a single prompt. AI decomposed it into:

### Epic
`VIS-000` — Visitor Registration System

### Stories (AI-generated from spec analysis)
| ID | Story | Role | Effort |
|----|-------|------|--------|
| VIS-001 | Project scaffold + CI/CD | DevOps | S |
| VIS-002 | Magic link authentication | Visitor + Admin | M |
| VIS-003 | Submit visit request form | Visitor | M |
| VIS-004 | Visitor dashboard | Visitor | M |
| VIS-005 | Edit/delete pending requests | Visitor | S |
| VIS-006 | Admin request list + filter | Admin | M |
| VIS-007 | Approve/reject with comment | Admin | M |
| VIS-008 | Admin stats summary | Admin | S |
| VIS-009 | RLS security hardening | Security | S |
| VIS-010 | Final documentation | Docs | S |

AI identified 2 hidden stories not in the spec:
- **VIS-005** (edit/delete) — implied by "visitors cannot edit approved requests" constraint
- **VIS-009** (RLS verification) — implied by security requirements

---

## Architecture Decisions (AI-proposed)

All decisions documented in `docs/ADR.md`. Summary:

| Decision | Choice | Rejected |
|----------|--------|---------|
| Component model | Standalone | NgModules |
| Auth method | Magic link | Password auth |
| Role storage | DB profiles table | JWT custom claims |
| State management | Angular Signals | NgRx, RxJS BehaviorSubject |
| Form handling | Reactive Forms | Template-driven |

---

## Risk Register (AI-identified)

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Magic link email delay | Medium | Show "check your inbox" message with resend option |
| RLS misconfiguration exposes all data | High | `WITH CHECK` policy + verification script |
| Flash redirect on cold page load | Medium | Async guards wait for `loading` signal |
| Admin role self-assignment | Low | Role in DB, not JWT — visitor cannot write profiles |
| Past visit date submission | Medium | Client validator + DB CHECK constraint |

---

## Development Phases

### Phase 1 — Foundation (VIS-001)
**Goal:** Everything compiles, CI passes, auth service exists but no UI  
**Exit:** `ng build` → 0 errors, `ng test` → passing, GitHub Actions green

### Phase 2 — Auth (VIS-002)
**Goal:** User can sign in and be redirected by role  
**Exit:** Magic link flow works end-to-end locally

### Phase 3 — Visitor Flows (VIS-003, 004, 005)
**Goal:** Visitor can submit, view, edit, delete pending requests  
**Exit:** All visitor stories functional with loading/error/empty states

### Phase 4 — Admin Flows (VIS-006, 007, 008)
**Goal:** Admin can view all requests, filter, approve/reject, see stats  
**Exit:** Full approve/reject flow with comment + optimistic UI update

### Phase 5 — Hardening + Docs (VIS-009, 010)
**Goal:** RLS verified, all documentation complete, transcripts committed  
**Exit:** 0 lint errors, 0 build errors, all tests green, CI passing

---

## Test Strategy

**Approach:** Test-first (TDD) — tests committed before implementation.  
This is the Level 4 marker and provides the AI control loop:  
> Write failing tests → AI implements → iterate until green

**Coverage:**
- Unit tests for components (vitest + Angular Testing Utilities)
- Service mocks via `vi.fn()`
- Guard tests for auth flow
- No E2E tests (out of scope for one-day hackathon)

---

## Out of Scope (documented to prevent scope creep)

- Email notifications to visitors on status change
- Calendar integration / time slot booking
- Multi-tenant (multiple offices)
- Receipt/attachment uploads
- Mobile native app
- i18n / multi-language
- Dark mode

---

## AI Process Evidence

| Stage | AI Contribution | Evidence Location |
|-------|----------------|-------------------|
| Requirements | Assumptions, hidden reqs, risks, edge cases | `docs/ai-transcripts/01-planning-requirements.md` |
| Architecture | ADRs, component diagram, RLS strategy | `docs/ADR.md` |
| UI/UX | Wireframes, component interaction flow | `docs/wireframes.md` |
| Development | Test-first implementation, per-story | `docs/ai-transcripts/02–08` |
| QA/Security | Code review notes, security checklist | `docs/security-checklist.md` |
| CI/CD | Workflow generation + lint fix | `.github/workflows/ci.yml` |
| SRE | Scalability analysis, observability stubs | `docs/scalability.md` |
| Tooling | Custom commands, hooks, MCP config | `.claude/` folder |

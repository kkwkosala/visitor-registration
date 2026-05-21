# Architecture Decision Records

## ADR-001: Angular Standalone Components (No NgModules)

| | |
|---|---|
| **Date** | 2026-05-21 |
| **Status** | Accepted |
| **Decision** | Use Angular 17+ standalone components throughout the application |
| **Reason** | Reduced boilerplate, faster bootstrapping, no NgModule declarations to maintain. Standalone is the Angular team's recommended default from v17 onwards. |
| **Alternatives considered** | Traditional NgModule architecture |
| **Rejected because** | NgModules add unnecessary ceremony for a single-day build. Every component import must be explicitly declared or imported — standalone components self-declare. |

---

## ADR-002: Supabase Magic Link (No Password Auth)

| | |
|---|---|
| **Date** | 2026-05-21 |
| **Status** | Accepted |
| **Decision** | Use Supabase email magic link for authentication |
| **Reason** | Zero password management code (no signup form, no bcrypt, no reset flows). One Supabase `signInWithOtp()` call = working, secure auth. Ideal for hackathon timebox. |
| **Alternatives considered** | Email + password auth, Google OAuth, GitHub OAuth |
| **Rejected because** | Password auth requires signup + login + reset = 3× the code. OAuth requires external app registration. Magic link is the fastest path to production-grade auth. |

---

## ADR-003: Admin Role via Database Profile (Not JWT Claims)

| | |
|---|---|
| **Date** | 2026-05-21 |
| **Status** | Accepted |
| **Decision** | Store `role` in `profiles.role` column; Angular reads it after login |
| **Reason** | Simpler to seed, understand, and verify. No custom Supabase JWT hook configuration needed. Role is readable via a standard DB query, testable with a simple SELECT. |
| **Alternatives considered** | Supabase `app_metadata.role` (custom JWT claims), PostgreSQL row-level role |
| **Rejected because** | Custom JWT claims require a Supabase Auth Hook (Pro feature or manual setup). `app_metadata` is not modifiable from the client SDK. Profile-based role works on the free tier and is fully transparent. |

---

## ADR-004: Angular Reactive Forms (Not Template-Driven)

| | |
|---|---|
| **Date** | 2026-05-21 |
| **Status** | Accepted |
| **Decision** | Use `ReactiveFormsModule` / `FormBuilder` for all forms |
| **Reason** | Programmatic control over validation state, testable without DOM rendering, explicit and predictable data flow. |
| **Alternatives considered** | Template-driven forms, ngx-formly, ng-dynamic-forms |
| **Rejected because** | Template-driven forms are harder to unit test (require DOM). Third-party form libraries add dependency risk and learning overhead within a one-day window. |

---

## ADR-005: Angular Signals for State (No NgRx)

| | |
|---|---|
| **Date** | 2026-05-21 |
| **Status** | Accepted |
| **Decision** | Use Angular Signals (`signal()`, `computed()`, `inject()`) in services for shared state |
| **Reason** | NgRx adds significant boilerplate (actions, reducers, effects, selectors, store). For a two-role, single-entity app, signals in a service achieve the same result in ~10% of the code. Angular 21 signals are first-class reactive primitives. |
| **Alternatives considered** | NgRx, Elf, Akita, NgRx SignalStore |
| **Rejected because** | Overkill for hackathon scope. Signals with `takeUntilDestroyed()` + `async` pipe covers all reactivity requirements. No additional dependencies. |

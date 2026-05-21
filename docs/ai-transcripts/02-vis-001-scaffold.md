# AI Transcript — VIS-001: Project Scaffold

**Date:** 2026-05-21  
**AI Tool:** GitHub Copilot (Claude Sonnet 4.6)  
**Story:** VIS-001 — Project scaffold, environments, auth service, guards, routing, CI/CD

---

## Objective

Bootstrap the Angular 21 project with all infrastructure in place before writing any feature code:
authentication service, route guards, lazy-loaded routing skeleton, Supabase integration,
GitHub Actions CI, and all documentation scaffolding.

---

## AI Implementation Approach

> **Prompt:** "Start with VIS-001. Scaffold the Angular project with all directories, models, services, guards, routes, and CI workflow."

**AI reasoning:**
- Use `ng new` with `--standalone --routing --style=scss` — standalone components are Angular 21 default
- Detected Angular 21.2 during scaffold (expected 17/18) — adjusted test approach to **vitest** instead of Karma/Jasmine
- `withComponentInputBinding()` added to `provideRouter()` to enable route param → `input()` signal binding
- Auth guards made **async** to prevent flash-redirect on cold page load (loading signal race condition)

---

## Key Technical Decisions Made by AI

### 1. Async Auth Guard Pattern
```typescript
// AI identified race condition: guard evaluates before session restores on cold load
// Fix: wait for loading signal to settle before checking auth state
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  await firstValueFrom(
    toObservable(auth.loading).pipe(filter(l => !l))
  );
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};
```

### 2. Signals-Based AuthService
```typescript
// AI chose signals over BehaviorSubject for simpler reactive state
private _session  = signal<Session | null>(null);
private _profile  = signal<Profile | null>(null);
private _loading  = signal(true);

readonly isAuthenticated = computed(() => !!this._session());
readonly role            = computed(() => this._profile()?.role ?? null);
readonly isAdmin         = computed(() => this._profile()?.role === 'admin');
```

### 3. Two-Layer Security
```
Client guards  → UX only (redirect on wrong role)
Supabase RLS   → actual security boundary (enforced server-side)
```

---

## Files Generated

| File | Purpose |
|------|---------|
| `src/environments/environment.ts` | Placeholder Supabase credentials |
| `src/app/core/services/supabase.service.ts` | Singleton Supabase client |
| `src/app/core/services/auth.service.ts` | Signals-based auth state |
| `src/app/core/guards/auth.guard.ts` | Async authentication guard |
| `src/app/core/guards/role.guard.ts` | Role-based redirect guard |
| `src/app/app.routes.ts` | Full lazy-loaded routing skeleton |
| `src/app/app.config.ts` | `provideRouter` with `withComponentInputBinding()` |
| `supabase/migrations/001_initial_schema.sql` | Tables, triggers, indexes |
| `supabase/rls_policies.sql` | Full RLS policy set |
| `.github/workflows/ci.yml` | lint + build + test on push/PR |

---

## Tests Written (Test-First)

```typescript
// auth.guard.spec.ts — written BEFORE guard implementation
it('should redirect unauthenticated user to /login')
it('should allow authenticated user through')
```

---

## AI Code Review Notes

> "The guard correctly handles the loading race condition. One concern: `firstValueFrom` will throw
> if the observable completes without emitting. Since `loading` is a signal-backed observable that
> always emits, this is safe — but worth documenting."

> "The `SECURITY DEFINER` on the profile trigger is intentional and necessary — the trigger needs
> to insert into `profiles` even though the user doesn't own that row yet at creation time."

---

## Commit

```
feat(VIS-001): project scaffold, auth service, guards, routing, CI/CD
```

**Tests:** 4 passing  
**Build:** 0 errors

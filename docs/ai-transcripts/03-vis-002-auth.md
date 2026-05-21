# AI Transcript — VIS-002: Authentication

**Date:** 2026-05-21  
**AI Tool:** GitHub Copilot (Claude Sonnet 4.6)  
**Story:** VIS-002 — Magic link login, auth callback, navbar

---

## Objective

Implement the full authentication flow: login page with magic link, callback handler that
redirects by role, and a persistent navbar showing user identity and sign-out.

---

## AI Implementation Approach

> **Prompt:** "next" (proceed to VIS-002)

**AI reasoning:**
- Magic link chosen over password auth (ADR-002) — reduces auth surface area, no password storage
- `LoginComponent` uses reactive forms for built-in validation integration
- `AuthCallbackComponent` must react exactly once when role becomes available post-token-exchange
- `NavbarComponent` shows role badge to make current user context always visible

---

## Tests Written First (TDD)

```typescript
// login.component.spec.ts — ALL written before implementation
it('should create the component')
it('should show validation error when submitted empty')
it('should show validation error for invalid email format')
it('should call sendMagicLink with email on valid submit')
it('should show success message after magic link sent')
it('should show error message when sendMagicLink fails')
```

---

## Key Implementations

### LoginComponent — Reactive Form with States
```typescript
// Three exclusive UI states: idle | success | error
protected sent    = signal(false);
protected loading = signal(false);
protected error   = signal<string | null>(null);

async submit(): Promise<void> {
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  this.loading.set(true);
  const { error } = await this.auth.sendMagicLink(this.email.value!);
  error ? this.error.set(error) : this.sent.set(true);
  this.loading.set(false);
}
```

### AuthCallbackComponent — One-Shot Role Observer
```typescript
// AI pattern: toObservable + filter + take(1) fires exactly once
// when role signal transitions from null → 'visitor' | 'admin'
toObservable(this.auth.role).pipe(
  filter(role => role !== null),
  take(1)
).subscribe(role => {
  this.router.navigate([role === 'admin' ? '/admin/dashboard' : '/visitor/dashboard']);
});

// 8-second fallback to /login if callback never resolves
setTimeout(() => this.router.navigate(['/login']), 8000);
```

### NavbarComponent — Role Badge
```typescript
// TitleCasePipe transforms 'visitor' → 'Visitor', 'admin' → 'Admin'
template: `
  <nav class="navbar">
    <span class="badge badge-{{ auth.role() }}">{{ auth.role() | titlecase }}</span>
    <span>{{ auth.email() }}</span>
    <button (click)="signOut()">Sign out</button>
  </nav>
`
```

---

## AI Bug Caught During Review

**Problem:** Import path depth error — `NavbarComponent` is 3 directories deep from `src/app/`:
```typescript
// Wrong (2 levels):
import { AuthService } from '../../core/services/auth.service';
// Correct (3 levels):
import { AuthService } from '../../../core/services/auth.service';
```
> "Import path depth errors are silent at development time but will break the build.
> Always count directory levels from the component file location."

---

## AI Security Review

> "The callback component has an 8-second hard fallback to `/login`. This prevents a user being
> stranded on `/auth/callback` if the Supabase token exchange fails silently. Acceptable for
> hackathon scope — production would show a specific error message instead."

---

## Commit

```
feat(VIS-002): magic link login, auth callback, navbar
```

**Tests:** 10 passing (6 new)  
**Build:** 0 errors

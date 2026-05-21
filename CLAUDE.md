# CLAUDE.md — Project AI Context

This file is read automatically by Claude Code and GitHub Copilot at the start of every session.
It provides project-specific rules so AI generates consistent, correct code without re-explanation.

---

## Project

**Visitor Registration System** — Angular 21 SPA + Supabase backend.  
Visitors submit visit requests. Admins approve or reject them.

---

## Architecture Rules (enforce strictly)

### Layer boundaries
```
WebApi (Angular components) → Services → Supabase (PostgreSQL + RLS)
```
- Components call services only — never call Supabase client directly from a component
- Services handle all Supabase calls and return `{ data, error }` shapes
- Guards are UX only — RLS is the real security boundary

### Vertical slice pattern
Every feature lives in its own folder:
```
features/<domain>/<story>/
  <story>.component.ts
  <story>.component.spec.ts
```
- No cross-feature imports (shared code goes in `shared/` or `core/`)
- Each component is standalone (`standalone: true`, explicit `imports: []`)

### Signal-first state
```typescript
// ✅ DO
protected loading = signal(false);
protected data    = signal<T[]>([]);
protected derived = computed(() => this.data().filter(...));

// ❌ DO NOT
private subject = new BehaviorSubject(false);
@Input() value: string;  // use input() instead
```

### Component inputs
```typescript
// ✅ Angular 21 style
readonly id = input<string>();               // optional
readonly status = input.required<Status>(); // required

// ❌ Legacy style
@Input() id: string;
```

### Async pattern
```typescript
// ✅ Always async/await for Supabase calls
const { data, error } = await this.supabase.from('...').select('*');

// ❌ Never subscribe to Supabase promises
```

---

## Test-First Rule (Level 4+ requirement)

**Tests must be committed BEFORE the implementation they cover.**  
This is verifiable from `git log` and is the primary Level 4 marker.

```typescript
// All test files use vitest (Angular 21 default)
// Globals: describe, it, expect, vi, beforeEach
// NO jasmine.*, NO TestBed.inject for spies — use vi.spyOn()

// Pattern:
describe('ComponentName', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should do X when Y')         // happy path
  it('should show error when Z')   // failure path
  it('should show loading state')  // async state
});
```

---

## Database Rules

- **Never modify** `supabase/migrations/` files after they've been applied
- New schema changes → new migration file: `002_description.sql`
- RLS must be enabled on every table: `ALTER TABLE x ENABLE ROW LEVEL SECURITY`
- Every new table needs visitor + admin policies

---

## Commit Convention

```
feat(VIS-XXX): short description      ← new feature
fix(VIS-XXX): short description       ← bug fix
test(VIS-XXX): add tests for X        ← test-only commit
docs(VIS-XXX): update ADR / README    ← docs only
refactor(VIS-XXX): rename / move      ← no behaviour change
```

Always append:
```
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

## Files AI Must NOT Modify

- `frontend/dist/`
- `frontend/.angular/`
- `supabase/migrations/` (existing files)
- `frontend/src/environments/environment.prod.ts`
- `*.csproj`, `package-lock.json` (except via npm install)

---

## Running the App

```bash
cd frontend
npm install
ng serve           # dev server → http://localhost:4200
ng test --watch=false  # run tests once
ng lint            # lint check
ng build           # production build check
```

---

## Custom AI Commands (in `.claude/commands/`)

| Command | Purpose |
|---------|---------|
| `/new-story` | Implement a new story TDD-first |
| `/review` | Structured code review against project rules |
| `/security-check` | Auth, RLS, and input validation review |
| `/rls-verify` | Step-by-step RLS policy verification |

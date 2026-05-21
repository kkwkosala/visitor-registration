# /new-story — AI Story Implementation Command

Implements a new user story following the project's TDD + vertical slice pattern.

## Usage
```
/new-story VIS-XXX "story title" "brief description"
```

## What this command does

1. **Reads** `docs/ADR.md` and `CLAUDE.md` for architectural constraints
2. **Analyses** the story requirements and identifies affected files
3. **Writes tests first** in the feature's `*.spec.ts` file
4. **Implements** handler, component, and service changes
5. **Runs** `ng test --watch=false` — iterates until green
6. **Runs** `ng lint` — fixes any violations
7. **Runs** `ng build` — confirms zero errors
8. **Suggests** commit message in format: `feat(VIS-XXX): description`

## Constraints (from CLAUDE.md)

- Follow vertical slice pattern: `features/<name>/<story>/`
- One component per story — no shared state between feature slices
- Tests written BEFORE implementation (Level 4+ requirement)
- RLS handles server-side security — client guards are UX only
- Use Angular signals (`signal()`, `computed()`) — no RxJS BehaviorSubject
- Use `input()` / `input.required()` — not `@Input()` decorator

## Example

```
/new-story VIS-011 "visitor notifications" "email notification when request approved"
```

AI will:
- Create `frontend/src/app/features/visitor/notifications/`
- Write spec file with failing tests first
- Implement component
- Add route to `visitor.routes.ts`
- Suggest Supabase trigger or edge function if needed

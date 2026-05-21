# /review — AI Code Review Command

Performs a structured AI code review on staged or specified changes.

## Usage
```
/review                    # reviews staged changes (git diff --staged)
/review <file-path>        # reviews a specific file
/review VIS-XXX            # reviews all files changed for a story
```

## Review Checklist

AI will evaluate and report on each category:

### 1. Architecture Compliance
- [ ] Follows vertical slice pattern (no cross-feature imports)
- [ ] Component is standalone (no NgModule declarations)
- [ ] Business logic is in the component/service, not template
- [ ] Lazy-loaded route registered correctly

### 2. Security
- [ ] No secrets or credentials in code
- [ ] User input is validated (reactive form validators)
- [ ] No client-side-only auth checks (RLS must back it up)
- [ ] No direct SQL or raw Supabase client in components

### 3. Accessibility
- [ ] Form inputs have associated `<label>` elements
- [ ] Buttons (not divs) used for interactive elements
- [ ] `data-testid` attributes on key elements
- [ ] Loading/empty/error states are visible

### 4. Angular Best Practices
- [ ] Uses `signal()` / `computed()` — not manual subscriptions
- [ ] Uses `input()` / `input.required()` — not `@Input()` decorator
- [ ] `async/await` for Supabase calls — no `.subscribe()` chains
- [ ] No memory leaks (no unsubscribed observables)

### 5. Test Coverage
- [ ] Tests were written BEFORE implementation (check git log order)
- [ ] Happy path covered
- [ ] At least one error/failure path covered
- [ ] Mocks use `vi.fn()` — not Jasmine spies

## Output Format

```
## Review: <file>

✅ Architecture: compliant
⚠️  Security: [issue found]
✅ Accessibility: compliant
✅ Angular patterns: compliant
✅ Tests: written first, meaningful coverage

### Issues
1. [CRITICAL] ...
2. [WARNING] ...

### Suggested improvements
- ...

### Commit readiness: APPROVED / NEEDS CHANGES
```

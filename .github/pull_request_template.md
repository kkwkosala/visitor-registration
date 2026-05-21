## Summary

<!-- One paragraph: what this PR does and why -->

## Story

<!-- VIS-XXX: Story title -->

## Type of change

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `refactor` — no behaviour change
- [ ] `test` — tests only
- [ ] `docs` — documentation only

---

## Tests

- [ ] Tests written **before** implementation (TDD — check git log order)
- [ ] All existing tests still pass (`ng test --watch=false`)
- [ ] New tests cover happy path and at least one failure path

**Test count before:** ___  
**Test count after:** ___

---

## Design Rationale

### What I considered
<!-- Options you evaluated -->

### What I rejected and why
<!-- Alternatives dismissed and the reasoning -->

### Key decision
<!-- The chosen approach and why it's right for this scope -->

---

## Security Checklist

- [ ] No secrets committed
- [ ] Input validation on all new form fields
- [ ] RLS backs up any new client-side ownership check
- [ ] No new Supabase calls directly from components (go via service)
- [ ] `data-testid` attributes on interactive elements

---

## AI Review Notes

<!-- Paste any AI-generated review comments and how you addressed them -->

---

## Checklist

- [ ] `ng lint` — 0 errors
- [ ] `ng build` — 0 errors  
- [ ] `ng test --watch=false` — all passing
- [ ] `docs/ADR.md` updated if an architecture decision was made
- [ ] Commit message follows convention: `feat(VIS-XXX): description`

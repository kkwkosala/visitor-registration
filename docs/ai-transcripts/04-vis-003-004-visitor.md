# AI Transcript — VIS-003/004: Visitor Request Form + Dashboard

**Date:** 2026-05-21  
**AI Tool:** GitHub Copilot (Claude Sonnet 4.6)  
**Stories:** VIS-003 (Visit Request Form) + VIS-004 (Visitor Dashboard)

---

## VIS-003 — Visit Request Form

### Objective
Allow visitors to submit new visit requests and edit existing pending requests.
A single component handles both modes, driven by an optional route parameter.

### Tests Written First

```typescript
// visit-request-form.component.spec.ts — ALL written before implementation
it('should create the component in create mode')
it('should show validation errors when submitted empty')
it('should call createRequest on valid new submission')
it('should load existing request in edit mode')
it('should show error when editing non-pending request')
it('should call updateRequest on valid edit submission')
it('should disable submit button while loading')
```

### Key Implementation

**Dual mode via `input()` signal:**
```typescript
// withComponentInputBinding() in app.config.ts enables this
readonly id = input<string>(); // undefined = create mode, string = edit mode

ngOnInit(): void {
  if (this.id()) {
    this.loadExistingRequest(this.id()!);
  }
}
```

**Custom date validator — prevents past dates:**
```typescript
function minDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const today = new Date().toISOString().split('T')[0];
  return control.value < today ? { minDate: { min: today, actual: control.value } } : null;
}
```

**Non-pending guard — shows error instead of form:**
```typescript
private async loadExistingRequest(id: string): Promise<void> {
  const { data } = await this.requestSvc.getRequestById(id);
  if (data?.status !== 'pending') {
    this.editError.set(`Cannot edit a ${data?.status} request.`);
    return; // form never shown
  }
  this.patchForm(data);
}
```

### AI Review Notes

> "Belt-and-suspenders validation: `minDateValidator` on client + `visit_date >= CURRENT_DATE`
> CHECK constraint on the database. Client validation is UX, DB constraint is integrity."

> "The `editError` signal approach is cleaner than redirecting — the visitor sees exactly why
> they cannot edit, rather than a confusing redirect to dashboard."

---

## VIS-004 — Visitor Dashboard

### Objective
Show visitors all their own requests in a table with status badges.
Allow delete of pending requests with inline confirmation modal.

### Tests Written First

```typescript
// visitor-dashboard.component.spec.ts — ALL written before implementation
it('should show loading spinner while fetching')
it('should render all returned requests as table rows')
it('should show empty state when no requests exist')
it('should show edit link only for pending requests')
it('should show error state on service failure')
```

### Key Implementation

**Signals-based request state:**
```typescript
protected requests    = signal<VisitRequest[]>([]);
protected loading     = signal(true);
protected error       = signal<string | null>(null);
protected deleteTarget = signal<VisitRequest | null>(null);
protected deleting    = signal(false);
protected deleteError = signal<string | null>(null);
```

**StatusBadgeComponent — reusable across visitor and admin:**
```typescript
@Component({
  selector: 'app-status-badge',
  template: `<span class="badge badge-{{ status() }}">{{ label() }}</span>`
})
export class StatusBadgeComponent {
  readonly status = input.required<RequestStatus>();
  protected label = computed(() => ({
    pending: 'Pending', approved: 'Approved', rejected: 'Rejected'
  })[this.status()]);
}
```

### AI Bug Caught

**Import depth on StatusBadgeComponent:**
```typescript
// Wrong — component is at src/app/shared/components/status-badge/
import { RequestStatus } from '../../core/models/visit-request.model';
// Correct:
import { RequestStatus } from '../../../core/models/visit-request.model';
```

### AI Security Note

> "Visitors only see their own requests because `getOwnRequests()` in the service calls
> `.select('*').eq('user_id', userId)`. However, the real guarantee is RLS — even if
> a client bypassed this filter, Supabase would enforce `user_id = auth.uid()` server-side."

---

## Commit

```
feat(VIS-003): visit request form with create and edit modes
feat(VIS-004): visitor dashboard with delete confirm modal
```

**Tests:** 22 passing (14 new across both stories)  
**Build:** 0 errors

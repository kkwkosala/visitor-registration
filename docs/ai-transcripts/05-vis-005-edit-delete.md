# AI Transcript — VIS-005: Edit/Delete Pending Requests

**Date:** 2026-05-21  
**AI Tool:** GitHub Copilot (Claude Sonnet 4.6)  
**Story:** VIS-005 — Visitors can only edit/delete requests while status is pending

---

## Objective

Enforce the business rule: visitors cannot modify approved or rejected requests.
This applies to both the edit form and the delete action.

---

## AI Implementation Approach

> **AI reasoning:** VIS-005 is not a standalone feature — it is woven into VIS-003 and VIS-004.
> Rather than creating new files, the protection is built directly into the existing components.

---

## Where Protection Is Enforced

### 1. Edit Route — `VisitRequestFormComponent`
When loading in edit mode, the component checks status before showing the form:

```typescript
private async loadExistingRequest(id: string): Promise<void> {
  const { data, error } = await this.requestSvc.getRequestById(id);

  if (error || !data) {
    this.editError.set('Request not found.');
    return;
  }

  // VIS-005: Block edit if not pending
  if (data.status !== 'pending') {
    this.editError.set(
      `This request has been ${data.status}. Only pending requests can be edited.`
    );
    return; // form never rendered
  }

  this.isEditMode.set(true);
  this.patchForm(data);
}
```

**User sees:** Error message explaining why the form is not shown. No silent redirect.

### 2. Dashboard — Delete Button Visibility
In `VisitorDashboardComponent`, the delete button only renders for pending requests:

```html
@if (req.status === 'pending') {
  <button class="btn btn-sm btn-danger" (click)="confirmDelete(req)">Delete</button>
}
@if (req.status === 'pending') {
  <a [routerLink]="['/visitor/requests', req.id, 'edit']" class="btn btn-sm">Edit</a>
}
```

### 3. RLS — Server-Side Enforcement
The Supabase UPDATE policy uses `WITH CHECK` to reject any edit of a non-pending row:

```sql
-- Visitor can only UPDATE rows where status is currently 'pending'
CREATE POLICY "Visitors update own pending requests" ON visit_requests
  FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (status = 'pending');
```

Even if a visitor bypasses the client-side check, the database rejects the write.

---

## Failure Scenario Coverage (from requirements)

> **Scenario 1:** Visitor attempts to edit an approved request  
> **Result:** `VisitRequestFormComponent` detects `status !== 'pending'` on load → displays:
> `"This request has been approved. Only pending requests can be edited."`  
> Form is never rendered. No HTTP write is attempted.

---

## AI Review Notes

> "Three layers of protection for this business rule:
> 1. UI: buttons hidden for non-pending rows
> 2. Client logic: form component checks status before rendering
> 3. Database RLS: server rejects any UPDATE on non-pending rows
>
> The redundancy is intentional. Never rely on client-side guards alone."

---

## Commit

*(Delivered as part of VIS-004 commit — no additional files needed)*

```
feat(VIS-004): visitor dashboard with delete confirm modal
```

**Tests:** Covered by VIS-003 spec (test: 'should show error when editing non-pending request')  
**Build:** 0 errors

import { Component, input } from '@angular/core';
import { RequestStatus } from '../../../core/models/visit-request.model';

const LABELS: Record<RequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

@Component({
  selector: 'app-status-badge',
  template: `
    <span class="badge badge-{{ status() }}">
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<RequestStatus>();
  protected label = () => LABELS[this.status()];
}

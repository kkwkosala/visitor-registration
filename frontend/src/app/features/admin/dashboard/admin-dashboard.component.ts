import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitRequestService } from '../../../core/services/visit-request.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import {
  VisitRequest,
  RequestStatus,
  UpdateRequestStatusDto,
} from '../../../core/models/visit-request.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DatePipe, FormsModule, StatusBadgeComponent],
  template: `
    <!-- Stats cards (VIS-008) -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats().total }}</div>
        <div class="stat-label">Total Requests</div>
      </div>
      <div class="stat-card stat-pending">
        <div class="stat-value">{{ stats().pending }}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card stat-approved">
        <div class="stat-value">{{ stats().approved }}</div>
        <div class="stat-label">Approved</div>
      </div>
      <div class="stat-card stat-rejected">
        <div class="stat-value">{{ stats().rejected }}</div>
        <div class="stat-label">Rejected</div>
      </div>
    </div>

    <!-- Filter bar (VIS-006) -->
    <div class="filter-bar">
      <span class="filter-label">Filter by status:</span>
      <div class="filter-buttons" role="group" aria-label="Filter by status">
        @for (opt of filterOptions; track opt.value) {
          <button
            class="btn btn-sm"
            [class.btn-primary]="filterStatus() === opt.value"
            (click)="filterStatus.set(opt.value)"
          >
            {{ opt.label }}
          </button>
        }
      </div>
    </div>

    <!-- Loading -->
    @if (loading()) {
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading requests�</p>
      </div>
    }

    <!-- Error -->
    @else if (loadError()) {
      <div class="error-state">
        <p>{{ loadError() }}</p>
        <button class="btn btn-primary" (click)="loadRequests()">Retry</button>
      </div>
    }

    <!-- Table -->
    @else if (filteredRequests().length > 0) {
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Visitor</th>
              <th>Email</th>
              <th>Purpose</th>
              <th>Visit Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (req of filteredRequests(); track req.id) {
              <tr data-testid="request-row">
                <td>{{ req.visitor_name }}</td>
                <td>{{ req.email }}</td>
                <td>{{ req.purpose }}</td>
                <td>{{ req.visit_date | date:'mediumDate' }}</td>
                <td><app-status-badge [status]="req.status" /></td>
                <td class="action-cell">
                  @if (req.status === 'pending') {
                    <button
                      class="btn btn-sm btn-success"
                      data-testid="approve-btn"
                      (click)="openAction(req, 'approved')"
                    >
                      Approve
                    </button>
                    <button
                      class="btn btn-sm btn-danger"
                      (click)="openAction(req, 'rejected')"
                    >
                      Reject
                    </button>
                  } @else {
                    <span class="text-muted">�</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- Empty state -->
    @else {
      <div class="empty-state" data-testid="empty-state">
        <p>No requests match the current filter.</p>
      </div>
    }

    <!-- Action modal (VIS-007) -->
    @if (actionTarget()) {
      <div class="modal-overlay">
        <div class="modal" role="dialog" aria-modal="true">
          <h2>{{ actionVerb() }} Visit Request</h2>
          <p>
            Visitor: <strong>{{ actionTarget()!.visitor_name }}</strong><br />
            Date: <strong>{{ actionTarget()!.visit_date | date:'mediumDate' }}</strong>
          </p>
          <label class="form-label" for="admin-comment">
            Comment <span class="text-muted">(optional)</span>
          </label>
          <textarea
            id="admin-comment"
            class="form-control"
            rows="3"
            placeholder="Add a note to the visitor�"
            [(ngModel)]="actionCommentBound"
          ></textarea>

          @if (actionError()) {
            <p class="form-error">{{ actionError() }}</p>
          }

          <div class="modal-actions">
            <button class="btn" (click)="closeAction()" [disabled]="submitting()">
              Cancel
            </button>
            <button
              class="btn btn-primary"
              (click)="submitAction()"
              [disabled]="submitting()"
            >
              @if (submitting()) {
                <span class="spinner-sm"></span>
              } @else {
                Confirm {{ actionVerb() }}
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; padding: 1.5rem; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
    }
    .stat-value { font-size: 2rem; font-weight: 700; }
    .stat-label { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }
    .stat-pending  .stat-value { color: #b45309; }
    .stat-approved .stat-value { color: #065f46; }
    .stat-rejected .stat-value { color: #991b1b; }

    .filter-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .filter-label { font-size: 0.9rem; font-weight: 500; }
    .filter-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .btn-sm { padding: 0.25rem 0.75rem; font-size: 0.85rem; }

    .action-cell { display: flex; gap: 0.4rem; }
    .btn-success { background: #065f46; color: #fff; border-color: #065f46; }
    .btn-success:hover { background: #047857; }
    .btn-danger  { background: #991b1b; color: #fff; border-color: #991b1b; }
    .btn-danger:hover  { background: #b91c1c; }

    .spinner-sm {
      display: inline-block;
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private requestSvc = inject(VisitRequestService);

  protected allRequests  = signal<VisitRequest[]>([]);
  protected loading      = signal(true);
  protected loadError    = signal<string | null>(null);

  protected filterStatus = signal<RequestStatus | 'all'>('all');

  protected filteredRequests = computed(() => {
    const f = this.filterStatus();
    return f === 'all'
      ? this.allRequests()
      : this.allRequests().filter(r => r.status === f);
  });

  protected stats = computed(() => {
    const all = this.allRequests();
    return {
      total:    all.length,
      pending:  all.filter(r => r.status === 'pending').length,
      approved: all.filter(r => r.status === 'approved').length,
      rejected: all.filter(r => r.status === 'rejected').length,
    };
  });

  // VIS-007 action state
  protected actionTarget  = signal<VisitRequest | null>(null);
  protected actionNewStatus = signal<RequestStatus>('approved');
  protected actionComment = signal('');
  protected actionError   = signal<string | null>(null);
  protected submitting    = signal(false);

  get actionCommentBound(): string { return this.actionComment(); }
  set actionCommentBound(v: string) { this.actionComment.set(v); }

  protected actionVerb = computed(() =>
    this.actionNewStatus() === 'approved' ? 'Approve' : 'Reject'
  );

  readonly filterOptions: { value: RequestStatus | 'all'; label: string }[] = [
    { value: 'all',      label: 'All'      },
    { value: 'pending',  label: 'Pending'  },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  ngOnInit(): void {
    this.loadRequests();
  }

  async loadRequests(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    const { data, error } = await this.requestSvc.getAllRequests();

    if (error) {
      this.loadError.set(`Failed to load requests: ${error}`);
    } else {
      this.allRequests.set(data);
    }
    this.loading.set(false);
  }

  protected openAction(req: VisitRequest, newStatus: RequestStatus): void {
    this.actionTarget.set(req);
    this.actionNewStatus.set(newStatus);
    this.actionComment.set('');
    this.actionError.set(null);
  }

  protected closeAction(): void {
    this.actionTarget.set(null);
  }

  protected async submitAction(): Promise<void> {
    const target = this.actionTarget();
    if (!target) return;

    this.submitting.set(true);
    this.actionError.set(null);

    const dto: UpdateRequestStatusDto = {
      status: this.actionNewStatus(),
      admin_comment: this.actionComment() || undefined,
    };

    const { error } = await this.requestSvc.updateRequestStatus(target.id, dto);

    if (error) {
      this.actionError.set(`Action failed: ${error}`);
      this.submitting.set(false);
    } else {
      // Optimistic update in place
      this.allRequests.update(list =>
        list.map(r =>
          r.id === target.id
            ? { ...r, status: dto.status, admin_comment: dto.admin_comment ?? null }
            : r
        )
      );
      this.submitting.set(false);
      this.closeAction();
    }
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { VisitRequestService } from '../../../core/services/visit-request.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { VisitRequest } from '../../../core/models/visit-request.model';

@Component({
  selector: 'app-visitor-dashboard',
  imports: [RouterLink, DatePipe, StatusBadgeComponent],
  template: `
    <div class="page-content">
      <div class="page-header">
        <h1>My Visit Requests</h1>
        <a routerLink="/visitor/requests/new" class="btn btn-primary btn-sm">
          + New request
        </a>
      </div>

      @if (loading()) {
        <div class="state-container">
          <span class="spinner"></span>
          <p>Loading your requests…</p>
        </div>
      } @else if (error()) {
        <div class="alert alert-error" data-testid="error-state">
          {{ error() }}
        </div>
      } @else if (requests().length === 0) {
        <div class="state-container" data-testid="empty-state">
          <div class="icon">📋</div>
          <p><strong>No visit requests yet</strong></p>
          <p>Submit your first request to get started.</p>
          <a routerLink="/visitor/requests/new" class="btn btn-primary btn-sm">
            Submit a request
          </a>
        </div>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Purpose</th>
              <th>Visit date</th>
              <th>Status</th>
              <th>Comment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (req of requests(); track req.id) {
              <tr data-testid="request-row">
                <td>{{ req.visitor_name }}</td>
                <td>{{ req.purpose }}</td>
                <td>{{ req.visit_date | date:'mediumDate' }}</td>
                <td><app-status-badge [status]="req.status" /></td>
                <td>{{ req.admin_comment ?? '—' }}</td>
                <td>
                  @if (req.status === 'pending') {
                    <a
                      [routerLink]="['/visitor/requests', req.id, 'edit']"
                      class="btn btn-secondary btn-sm"
                      data-testid="edit-link"
                    >
                      Edit
                    </a>
                    <button
                      class="btn btn-danger btn-sm"
                      style="margin-left: 0.4rem"
                      data-testid="delete-btn"
                      (click)="confirmDelete(req)"
                    >
                      Delete
                    </button>
                  } @else {
                    <span style="color: var(--text-muted); font-size:0.8rem">Locked</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      @if (deleteTarget()) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <h2>Delete request?</h2>
            <p>
              Delete the visit request for
              <strong>{{ deleteTarget()!.visit_date | date:'mediumDate' }}</strong>?
              This cannot be undone.
            </p>
            @if (deleteError()) {
              <div class="alert alert-error">{{ deleteError() }}</div>
            }
            <div style="display:flex; gap:0.75rem; margin-top:1rem">
              <button class="btn btn-danger" [disabled]="deleting()" (click)="doDelete()">
                {{ deleting() ? 'Deleting…' : 'Yes, delete' }}
              </button>
              <button class="btn btn-secondary" (click)="deleteTarget.set(null)">
                Cancel
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center; z-index: 200;
    }
    .modal-card {
      background: white; border-radius: 8px; padding: 1.5rem;
      max-width: 420px; width: 90%;
    }
  `],
})
export class VisitorDashboardComponent implements OnInit {
  private readonly service = inject(VisitRequestService);

  protected readonly requests = signal<VisitRequest[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly deleteTarget = signal<VisitRequest | null>(null);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadRequests();
  }

  protected confirmDelete(req: VisitRequest): void {
    this.deleteTarget.set(req);
    this.deleteError.set(null);
  }

  protected async doDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;

    this.deleting.set(true);
    const { error } = await this.service.deleteRequest(target.id);
    this.deleting.set(false);

    if (error) {
      this.deleteError.set(error);
    } else {
      this.deleteTarget.set(null);
      await this.loadRequests();
    }
  }

  private async loadRequests(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    const { data, error } = await this.service.getOwnRequests();
    this.loading.set(false);
    if (error) {
      this.error.set(error);
    } else {
      this.requests.set(data);
    }
  }
}

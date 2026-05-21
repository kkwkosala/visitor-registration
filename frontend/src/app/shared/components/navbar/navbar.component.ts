import { Component, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [TitleCasePipe],
  template: `
    <nav class="navbar">
      <span class="navbar-brand">🏢 Visitor Registration</span>
      <div class="navbar-right">
        <span class="badge badge-{{ auth.role() }}">
          {{ auth.role() | titlecase }}
        </span>
        <span class="navbar-email">{{ auth.profile()?.email }}</span>
        <button class="btn btn-sm btn-ghost" (click)="auth.signOut()">
          Sign out
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      height: 56px;
      background: white;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .navbar-brand { font-weight: 700; font-size: 1rem; }
    .navbar-right { display: flex; align-items: center; gap: 1rem; }
    .navbar-email { font-size: 0.875rem; color: var(--text-muted); }
  `],
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
}

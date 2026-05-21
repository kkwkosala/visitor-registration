import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  template: `
    <div class="callback-container">
      <p>Completing sign-in…</p>
      <span class="spinner"></span>
    </div>
  `,
  styles: [
    `
      .callback-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        gap: 1rem;
        color: var(--text-muted);
      }
    `,
  ],
})
export class AuthCallbackComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    // Supabase JS automatically exchanges the magic link token from the URL hash.
    // Watch the role signal — redirect as soon as the profile is loaded.
    toObservable(this.auth.role)
      .pipe(
        filter((role) => role !== null),
        take(1)
      )
      .subscribe((role) => {
        if (role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/visitor/dashboard']);
        }
      });

    // Fallback: if role never resolves (e.g. email not in auth.users), redirect to login
    setTimeout(() => {
      if (!this.auth.isAuthenticated()) {
        this.router.navigate(['/login']);
      }
    }, 8000);
  }
}

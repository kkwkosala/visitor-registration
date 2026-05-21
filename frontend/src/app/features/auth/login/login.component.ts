import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>🏢 Visitor Registration</h1>
        <p class="subtitle">Sign in to manage your visit requests</p>

        @if (!sent) {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">Email address</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                data-testid="email-input"
                placeholder="you@example.com"
                autocomplete="email"
                [class.is-invalid]="email.invalid && email.touched"
              />
              @if (email.invalid && email.touched) {
                <span class="error-text" data-testid="email-error">
                  @if (email.errors?.['required']) {
                    Email is required
                  } @else if (email.errors?.['email']) {
                    Please enter a valid email address
                  }
                </span>
              }
            </div>

            @if (error) {
              <div class="alert alert-error" data-testid="error-alert">
                {{ error }}
              </div>
            }

            <button
              type="submit"
              class="btn btn-primary"
              data-testid="submit-btn"
              [disabled]="loading"
            >
              {{ loading ? 'Sending…' : 'Send magic link' }}
            </button>
          </form>
        } @else {
          <div class="success-card" data-testid="success-message">
            <p class="success-icon">✅</p>
            <p><strong>Check your email!</strong></p>
            <p>
              We sent a sign-in link to
              <strong>{{ form.value.email }}</strong>
            </p>
            <button
              class="btn btn-secondary"
              (click)="sent = false"
            >
              Use a different email
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .auth-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: var(--bg-surface);
      }
      .auth-card {
        background: white;
        padding: 2.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
      }
      h1 {
        font-size: 1.5rem;
        margin: 0 0 0.25rem;
      }
      .subtitle {
        color: var(--text-muted);
        margin: 0 0 1.5rem;
        font-size: 0.95rem;
      }
      .success-icon {
        font-size: 2.5rem;
        margin: 0 0 0.5rem;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected get email() {
    return this.form.controls.email;
  }

  protected loading = false;
  protected sent = false;
  protected error: string | null = null;

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const { error } = await this.auth.sendMagicLink(this.form.value.email!);

    this.loading = false;

    if (error) {
      this.error = error;
    } else {
      this.sent = true;
    }
  }
}

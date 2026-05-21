import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>🏢 Visitor Registration</h1>
        <p class="subtitle">{{ isSignUp ? 'Create an account' : 'Sign in to your account' }}</p>

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
                @if (email.errors?.['required']) { Email is required }
                @else if (email.errors?.['email']) { Enter a valid email }
              </span>
            }
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              data-testid="password-input"
              placeholder="••••••••"
              autocomplete="{{ isSignUp ? 'new-password' : 'current-password' }}"
              [class.is-invalid]="password.invalid && password.touched"
            />
            @if (password.invalid && password.touched) {
              <span class="error-text" data-testid="password-error">
                @if (password.errors?.['required']) { Password is required }
                @else if (password.errors?.['minlength']) { Minimum 6 characters }
              </span>
            }
          </div>

          @if (error) {
            <div class="alert alert-error" data-testid="error-alert">{{ error }}</div>
          }
          @if (successMsg) {
            <div class="alert alert-success" data-testid="success-message">{{ successMsg }}</div>
          }

          <button
            type="submit"
            class="btn btn-primary"
            data-testid="submit-btn"
            [disabled]="loading"
          >
            {{ loading ? 'Please wait…' : (isSignUp ? 'Create account' : 'Sign in') }}
          </button>
        </form>

        <p class="toggle-text">
          {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
          <button class="link-btn" data-testid="toggle-mode" (click)="toggleMode()">
            {{ isSignUp ? 'Sign in' : 'Register' }}
          </button>
        </p>
      </div>
    </div>
  `,
  styles: [`
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
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
    }
    h1 { font-size: 1.5rem; margin: 0 0 0.25rem; }
    .subtitle { color: var(--text-muted); margin: 0 0 1.5rem; font-size: 0.95rem; }
    .toggle-text { margin-top: 1rem; text-align: center; font-size: 0.9rem; color: var(--text-muted); }
    .link-btn {
      background: none; border: none; color: var(--primary);
      cursor: pointer; font-size: 0.9rem; padding: 0; text-decoration: underline;
    }
    .alert-success { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; border-radius: 4px; padding: 0.75rem; margin-bottom: 1rem; }
  `],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected get email() { return this.form.controls.email; }
  protected get password() { return this.form.controls.password; }

  protected loading = false;
  protected isSignUp = false;
  protected error: string | null = null;
  protected successMsg: string | null = null;

  toggleMode(): void {
    this.isSignUp = !this.isSignUp;
    this.error = null;
    this.successMsg = null;
    this.form.reset();
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMsg = null;

    const { email, password } = this.form.value as { email: string; password: string };

    if (this.isSignUp) {
      const { error } = await this.auth.signUp(email, password);
      this.loading = false;
      if (error) {
        this.error = error;
      } else {
        this.successMsg = 'Account created! You can now sign in.';
        this.isSignUp = false;
        this.form.reset();
      }
    } else {
      const { error } = await this.auth.signIn(email, password);
      this.loading = false;
      if (error) {
        this.error = error;
      } else {
        this.router.navigate(['/auth/callback']);
      }
    }
  }
}

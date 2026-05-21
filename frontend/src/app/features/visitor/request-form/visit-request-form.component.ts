import { Component, OnInit, inject, input } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { VisitRequestService } from '../../../core/services/visit-request.service';
import { CreateVisitRequestDto } from '../../../core/models/visit-request.model';

/** Validates that the date value is today or in the future */
function minDateValidator(minDate: Date): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const input = new Date(control.value + 'T00:00:00');
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    return input >= min
      ? null
      : { minDate: { min: min.toISOString().split('T')[0], actual: control.value } };
  };
}

@Component({
  selector: 'app-visit-request-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-content">
      <div class="page-header">
        <h1>{{ isEditMode ? 'Edit Visit Request' : 'New Visit Request' }}</h1>
        <a routerLink="/visitor/dashboard" class="btn btn-secondary btn-sm">
          ← Back
        </a>
      </div>

      @if (loadingRequest) {
        <div class="state-container">
          <span class="spinner"></span>
          <p>Loading request…</p>
        </div>
      } @else if (loadError) {
        <div class="alert alert-error" data-testid="load-error">
          {{ loadError }}
        </div>
      } @else {
        <div class="card" style="max-width: 560px;">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">

            <!-- Visitor Name -->
            <div class="form-group">
              <label for="visitor_name">Full name</label>
              <input
                id="visitor_name"
                type="text"
                formControlName="visitor_name"
                data-testid="name-input"
                placeholder="Jane Smith"
                maxlength="100"
                [class.is-invalid]="f.visitor_name.invalid && f.visitor_name.touched"
              />
              @if (f.visitor_name.invalid && f.visitor_name.touched) {
                <span class="error-text" data-testid="name-error">
                  @if (f.visitor_name.errors?.['required']) { Full name is required }
                  @else if (f.visitor_name.errors?.['maxlength']) { Max 100 characters }
                </span>
              }
            </div>

            <!-- Email -->
            <div class="form-group">
              <label for="email">Email address</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                data-testid="email-input"
                placeholder="you@example.com"
                maxlength="254"
                [class.is-invalid]="f.email.invalid && f.email.touched"
              />
              @if (f.email.invalid && f.email.touched) {
                <span class="error-text" data-testid="email-error">
                  @if (f.email.errors?.['required']) { Email is required }
                  @else if (f.email.errors?.['email']) { Please enter a valid email address }
                </span>
              }
            </div>

            <!-- Purpose -->
            <div class="form-group">
              <label for="purpose">Purpose of visit</label>
              <textarea
                id="purpose"
                formControlName="purpose"
                data-testid="purpose-input"
                placeholder="e.g. Interview, client meeting, office tour…"
                rows="3"
                maxlength="500"
                [class.is-invalid]="f.purpose.invalid && f.purpose.touched"
              ></textarea>
              @if (f.purpose.invalid && f.purpose.touched) {
                <span class="error-text" data-testid="purpose-error">
                  @if (f.purpose.errors?.['required']) { Purpose is required }
                  @else if (f.purpose.errors?.['maxlength']) { Max 500 characters }
                </span>
              }
            </div>

            <!-- Visit Date -->
            <div class="form-group">
              <label for="visit_date">Visit date</label>
              <input
                id="visit_date"
                type="date"
                formControlName="visit_date"
                data-testid="date-input"
                [min]="todayStr"
                [class.is-invalid]="f.visit_date.invalid && f.visit_date.touched"
              />
              @if (f.visit_date.invalid && f.visit_date.touched) {
                <span class="error-text" data-testid="date-error">
                  @if (f.visit_date.errors?.['required']) { Visit date is required }
                  @else if (f.visit_date.errors?.['minDate']) {
                    Visit date must be today or in the future
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
              [disabled]="submitting"
            >
              {{ submitting ? 'Saving…' : (isEditMode ? 'Save changes' : 'Submit request') }}
            </button>
          </form>
        </div>
      }
    </div>
  `,
})
export class VisitRequestFormComponent implements OnInit {
  private readonly service = inject(VisitRequestService);
  private readonly router = inject(Router);

  /** Route param injected via withComponentInputBinding() */
  readonly id = input<string>();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    visitor_name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    purpose: ['', [Validators.required, Validators.maxLength(500)]],
    visit_date: ['', [Validators.required, minDateValidator(new Date())]],
  });

  protected get f() {
    return this.form.controls;
  }

  protected get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  protected get isEditMode(): boolean {
    return !!this.id();
  }

  protected loadingRequest = false;
  protected loadError: string | null = null;
  protected submitting = false;
  protected error: string | null = null;

  async ngOnInit(): Promise<void> {
    if (this.isEditMode) {
      await this.loadExistingRequest();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    const dto: CreateVisitRequestDto = this.form.getRawValue();

    const result = this.isEditMode
      ? await this.service.updateRequest(this.id()!, dto)
      : await this.service.createRequest(dto);

    this.submitting = false;

    if (result.error) {
      this.error = result.error;
    } else {
      this.router.navigate(['/visitor/dashboard']);
    }
  }

  private async loadExistingRequest(): Promise<void> {
    this.loadingRequest = true;
    const { data, error } = await this.service.getRequestById(this.id()!);
    this.loadingRequest = false;

    if (error || !data) {
      this.loadError = error ?? 'Request not found';
      return;
    }

    if (data.status !== 'pending') {
      this.loadError = 'This request cannot be edited — it has already been reviewed.';
      return;
    }

    this.form.setValue({
      visitor_name: data.visitor_name,
      email: data.email,
      purpose: data.purpose,
      visit_date: data.visit_date,
    });
  }
}

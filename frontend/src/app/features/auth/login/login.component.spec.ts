import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

const mockAuth = {
  sendMagicLink: vi.fn().mockResolvedValue({ error: null }),
  isAuthenticated: signal(false),
  loading: signal(false),
};

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show "Email is required" error when form submitted empty', async () => {
    const submitBtn: HTMLButtonElement =
      fixture.nativeElement.querySelector('[data-testid="submit-btn"]');
    submitBtn.click();
    fixture.detectChanges();

    const error: HTMLElement =
      fixture.nativeElement.querySelector('[data-testid="email-error"]');
    expect(error?.textContent?.trim()).toContain('Email is required');
  });

  it('should show "valid email" error for malformed email', () => {
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('[data-testid="email-input"]');
    input.value = 'not-an-email';
    input.dispatchEvent(new Event('input'));
    fixture.componentInstance['form'].controls.email.markAsTouched();
    fixture.detectChanges();

    const error: HTMLElement =
      fixture.nativeElement.querySelector('[data-testid="email-error"]');
    expect(error?.textContent?.trim()).toContain('valid email');
  });

  it('should call sendMagicLink with the entered email on valid submit', async () => {
    fixture.componentInstance['form'].controls.email.setValue('test@example.com');
    fixture.detectChanges();

    await fixture.componentInstance.onSubmit();

    expect(mockAuth.sendMagicLink).toHaveBeenCalledWith('test@example.com');
  });

  it('should show success state after magic link is sent', async () => {
    mockAuth.sendMagicLink.mockResolvedValue({ error: null });
    fixture.componentInstance['form'].controls.email.setValue('test@example.com');

    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    const success: HTMLElement =
      fixture.nativeElement.querySelector('[data-testid="success-message"]');
    expect(success).toBeTruthy();
  });

  it('should show error message when sendMagicLink fails', async () => {
    mockAuth.sendMagicLink.mockResolvedValue({ error: 'Email not allowed' });
    fixture.componentInstance['form'].controls.email.setValue('bad@example.com');

    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    const alert: HTMLElement =
      fixture.nativeElement.querySelector('[data-testid="error-alert"]');
    expect(alert?.textContent?.trim()).toContain('Email not allowed');
  });
});

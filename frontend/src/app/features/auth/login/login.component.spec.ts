import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

const mockAuth = {
  signIn: vi.fn().mockResolvedValue({ error: null }),
  signUp: vi.fn().mockResolvedValue({ error: null }),
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
        provideRouter([{ path: 'auth/callback', component: LoginComponent }]),
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

  it('should call signIn with email and password on valid submit', async () => {
    fixture.componentInstance['form'].setValue({ email: 'test@example.com', password: 'password123' });
    fixture.detectChanges();

    await fixture.componentInstance.onSubmit();

    expect(mockAuth.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should call signUp when in sign-up mode', async () => {
    fixture.componentInstance['isSignUp'] = true;
    fixture.componentInstance['form'].setValue({ email: 'new@example.com', password: 'password123' });
    fixture.detectChanges();

    await fixture.componentInstance.onSubmit();

    expect(mockAuth.signUp).toHaveBeenCalledWith('new@example.com', 'password123');
  });

  it('should show success message after sign-up', async () => {
    mockAuth.signUp.mockResolvedValue({ error: null });
    fixture.componentInstance['isSignUp'] = true;
    fixture.componentInstance['form'].setValue({ email: 'new@example.com', password: 'password123' });
    fixture.detectChanges();

    await fixture.componentInstance.onSubmit();
    await fixture.whenStable();
    fixture.detectChanges();

    const success: HTMLElement =
      fixture.nativeElement.querySelector('[data-testid="success-message"]');
    expect(success).toBeTruthy();
  });

  it('should show error message when signIn fails', async () => {
    mockAuth.signIn.mockResolvedValue({ error: 'Invalid credentials' });
    fixture.componentInstance['form'].setValue({ email: 'bad@example.com', password: 'wrongpass' });

    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    const alert: HTMLElement =
      fixture.nativeElement.querySelector('[data-testid="error-alert"]');
    expect(alert?.textContent?.trim()).toContain('Invalid credentials');
  });
});

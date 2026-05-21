import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { provideRouter } from '@angular/router';

describe('authGuard', () => {
  function setup(authenticated: boolean) {
    const mockAuth = {
      isAuthenticated: signal(authenticated),
      loading: signal(false), // loading already settled
    } as unknown as AuthService;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
      ],
    });

    return { mockAuth };
  }

  it('should redirect unauthenticated user to /login', async () => {
    setup(false);
    const result = await TestBed.runInInjectionContext(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authGuard({} as any, {} as any)
    );
    const router = TestBed.inject(Router);
    expect(result.toString()).toBe(router.createUrlTree(['/login']).toString());
  });

  it('should allow authenticated user through', async () => {
    setup(true);
    const result = await TestBed.runInInjectionContext(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authGuard({} as any, {} as any)
    );
    expect(result).toBe(true);
  });
});

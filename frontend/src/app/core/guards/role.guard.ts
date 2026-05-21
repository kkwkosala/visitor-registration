import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/profile.model';

export const roleGuard = (requiredRole: UserRole): CanActivateFn => {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // Wait for loading to settle before evaluating role
    if (auth.loading()) {
      await firstValueFrom(
        toObservable(auth.loading).pipe(filter((loading) => !loading))
      );
    }

    const role = auth.role();

    if (role === requiredRole) {
      return true;
    }

    if (role === 'admin') {
      return router.createUrlTree(['/admin/dashboard']);
    }
    if (role === 'visitor') {
      return router.createUrlTree(['/visitor/dashboard']);
    }

    return router.createUrlTree(['/login']);
  };
};

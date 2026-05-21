import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for the initial session restoration to complete before deciding
  if (auth.loading()) {
    await firstValueFrom(
      toObservable(auth.loading).pipe(filter((loading) => !loading))
    );
  }

  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

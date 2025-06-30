import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';
import { from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.currentUser$.pipe(
    switchMap(user => {
      if (user && user.uid) {
        return from(authService.isAdmin(user.uid)).pipe(
          switchMap(isAdmin => {
            if (isAdmin) {
              return of(true);
            } else {
              router.navigate(['/dashboard']);
              return of(false);
            }
          })
        );
      } else {
        router.navigate(['/login']);
        return of(false);
      }
    })
  );
}; 
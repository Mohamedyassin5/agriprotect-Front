import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = authService.isLoggedIn();
  console.log('AuthGuard: Checking access for', state.url, 'isLoggedIn=', isLoggedIn);

  if (isLoggedIn) {
    const role = authService.getUserRole();
    const isBackOfficePath = state.url.startsWith('/back-office');
    const isFrontOfficePath = state.url.startsWith('/front-office');

    // Rule: ADMIN stays in back-office. If they try to enter front-office, push them back.
    if (role === 'ADMIN' && isFrontOfficePath) {
      console.log('AuthGuard: ADMIN detected on front-office path. Redirecting to back-office.');
      router.navigate(['/back-office']);
      return false;
    }

    // Rule: FARMER stays in front-office. If they try to enter back-office, push them back.
    if (role === 'FARMER' && isBackOfficePath) {
      console.log('AuthGuard: FARMER detected on back-office path. Redirecting to front-office.');
      router.navigate(['/front-office']);
      return false;
    }

    console.log('AuthGuard: Access Granted for role:', role);
    return true;
  }

  console.warn('AuthGuard: Access Denied, redirecting to login');
  router.navigate(['/auth/login']);
  return false;
};

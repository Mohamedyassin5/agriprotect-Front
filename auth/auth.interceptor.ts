import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('token');
  // Public if it's an auth endpoint OR if it's a registration (POST to /agri/users)
  const isAuthPath = req.url.includes('/agri/auth/');
  const isRegistration = req.url === '/agri/users' && req.method === 'POST';
  
  const isPublic = isAuthPath || isRegistration;

  let authReq = req;
  if (token && !isPublic) {
    console.log('Interceptor: Adding token to private request:', req.url);
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else {
    console.log('Interceptor: Passing public/unauthenticated request:', req.url);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.group('Auth Interceptor Error Diagnosis');
      console.error(`Status: ${error.status}`);
      console.error(`URL: ${req.url}`);
      console.error('Error Body:', error.error);
      console.groupEnd();

      // Only logout on 401 (Unauthorized)
      if (error.status === 401) {
        console.warn('Interceptor: 401 Detected - Redirecting to login page');
        authService.logout();
      }
      
      return throwError(() => error);
    })
  );
}

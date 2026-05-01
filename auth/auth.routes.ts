import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(c => c.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent)
  },
  {
    path: 'verify-code',
    loadComponent: () => import('./verify-code/verify-code.component').then(c => c.VerifyCodeComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then(c => c.ResetPasswordComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];

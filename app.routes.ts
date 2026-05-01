import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'front-office',
    canActivate: [authGuard],
    loadChildren: () => import('./front-office/front-office.routes').then(m => m.FRONT_OFFICE_ROUTES)
  },
  {
    path: 'back-office',
    canActivate: [authGuard],
    loadChildren: () => import('./back-office/back-office.routes').then(m => m.BACK_OFFICE_ROUTES)
  },
  { path: '**', redirectTo: '/auth/login' }
];

import { Routes } from '@angular/router';
import { FrontOfficeComponent } from './front-office.component';

export const FRONT_OFFICE_ROUTES: Routes = [
  {
    path: '',
    component: FrontOfficeComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'crops',
        loadComponent: () => import('./crops/crops.component').then(m => m.CropsComponent)
      },
      {
        path: 'advisor',
        loadComponent: () => import('./dashboard/crop-recommendation/crop-recommendation.component').then(m => m.CropRecommendationComponent)
      },
      {
        path: 'insurance',
        loadChildren: () => import('./insurance/insurance.routes').then(m => m.INSURANCE_ROUTES)
      },
      {
        path: 'payment',
        loadChildren: () => import('./payment/payment.routes').then(m => m.PAYMENT_ROUTES)
      },
    
      {
        path: 'remboursement',
        loadChildren: () => import('./remboursement/remboursement.routes').then(m => m.REMBOURSEMENT_ROUTES)
      }
    ]
  }
];

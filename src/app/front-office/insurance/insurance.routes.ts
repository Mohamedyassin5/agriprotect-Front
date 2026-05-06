import { Routes } from '@angular/router';

export const INSURANCE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/insurance-dashboard/insurance-dashboard.component').then(m => m.InsuranceDashboardComponent),
    title: 'Tableau de bord Assurance'
  },
  {
    path: 'estimate',
    loadComponent: () =>
      import('./components/insurance-estimate/insurance-estimate.component').then(m => m.InsuranceEstimateComponent),
    title: 'Estimation de prime'
  },
  {
    path: 'subscribe',
    loadComponent: () =>
      import('./components/insurance-subscribe/insurance-subscribe.component').then(m => m.InsuranceSubscribeComponent),
    title: 'Souscrire une assurance'
  },
  {
    path: 'my-policies',
    loadComponent: () =>
      import('./components/insurance-list/insurance-list.component').then(m => m.InsuranceListComponent),
    title: 'Mes polices'
  },
  {
    path: ':id/detail',
    loadComponent: () =>
      import('./components/insurance-detail/insurance-detail.component').then(m => m.InsuranceDetailComponent),
    title: 'Détail de la police'
  },
  {
    path: ':id/certificate/:lang',
    loadComponent: () =>
      import('./components/insurance-certificate/insurance-certificate.component').then(m => m.InsuranceCertificateComponent),
    title: 'Certificat d\'assurance'
  },
  {
    path: ':id/certificate',
    redirectTo: ':id/certificate/FR',
    pathMatch: 'full'
  },
];
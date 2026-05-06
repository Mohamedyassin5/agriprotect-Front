import { Routes } from '@angular/router';
import { CreditWorkflowShellComponent } from './credit-workflow-shell.component';

export const CREDIT_WORKFLOW_ROUTES: Routes = [
  {
    path: '',
    component: CreditWorkflowShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./pages/credit-dashboard-page.component').then((m) => m.CreditDashboardPageComponent),
      },
      { path: 'dashboard', pathMatch: 'full', redirectTo: '' },
      {
        path: 'demandes',
        children: [
          {
            path: 'nouvelle',
            loadComponent: () =>
              import('./pages/demande-create-wizard.component').then((m) => m.DemandeCreateWizardComponent),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./pages/demande-detail-page.component').then((m) => m.DemandeDetailPageComponent),
          },
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./pages/demande-list-page.component').then((m) => m.DemandeListPageComponent),
          },
        ],
      },
      {
        path: 'simulation',
        loadComponent: () =>
          import('./pages/credit-simulation-page.component').then((m) => m.CreditSimulationPageComponent),
      },
    ],
  },
];

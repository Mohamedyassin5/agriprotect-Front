import { Routes } from '@angular/router';
import { BackOfficeComponent } from './back-office.component';

export const BACK_OFFICE_ROUTES: Routes = [
  {
    path: '',
    component: BackOfficeComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users-list.component').then(m => m.UsersListComponent)
      },
      {
        path: 'crops',
        loadComponent: () => import('./crops/crops-list.component').then(m => m.CropsListComponent)
      },
      {
        path: 'solidarity-funds',
        loadComponent: () => import('./solidarity-funds/solidarity-funds.component').then(m => m.AdminSolidarityFundsComponent)
      },
      {
        path: 'indemnisation',
        loadComponent: () => import('./indemnisation/indemnisation-list.component').then(m => m.IndemnisationListComponent)
      },
      {
        path: 'investigations',
        loadComponent: () => import('./investigations/investigations.component').then(m => m.InvestigationsComponent)
      },
      {
        path: 'qcm-generator',
        loadComponent: () => import('./qcm-management/qcm-management.component').then(m => m.QcmManagementComponent)
      },
      {
        path: 'insurances',
        loadComponent: () => import('./insurances/insurances-list.component').then(m => m.InsurancesListComponent)
      },
      {
        path: 'scheduler-tests',
        loadComponent: () => import('./scheduler-tests/scheduler-tests.component').then(m => m.SchedulerTestsComponent)
      },
      {
        path: 'cropsref',
        loadComponent: () => import('./cropsref/crops-ref.component').then(m => m.CropsRefComponent)
      },
      {
        path: 'remboursements',
        loadComponent: () => import('./remboursements/remboursements-admin.component').then(m => m.RemboursementsAdminComponent)
      },
      {
        path: 'dashboard/assurance',
        loadComponent: () => import('./dashboard/assurance/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'financial-overview',
        loadComponent: () => import('./financial-overview/financial-overview.component').then(m => m.FinancialOverviewComponent)
      },
      {
        path: 'marketplace-admin',
        loadComponent: () => import('./marketplace-admin/marketplace-admin.component').then(m => m.MarketplaceAdminComponent)
      },
      {
        path: 'wallet-admin',
        loadComponent: () => import('./wallet-admin/wallet-admin.component').then(m => m.WalletAdminComponent)
      },
      {
        path: 'incident-management',
        loadComponent: () => import('./incident-management/incident-management.component').then(m => m.IncidentManagementComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'credit',
        loadChildren: () => import('./credit-workflow/credit-workflow.routes').then((m) => m.CREDIT_WORKFLOW_ROUTES),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];


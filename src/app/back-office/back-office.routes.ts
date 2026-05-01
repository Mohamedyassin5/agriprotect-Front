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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

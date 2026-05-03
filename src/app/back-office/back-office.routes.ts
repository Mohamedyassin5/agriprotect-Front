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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

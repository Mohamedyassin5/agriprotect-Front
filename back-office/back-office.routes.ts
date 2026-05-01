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
        path: 'insurances',
        loadComponent: () => import('./insurances/insurances-list.component').then(m => m.InsurancesListComponent)
      },
      {
        path: 'scheduler-tests',
        loadComponent: () => import('./scheduler-tests/scheduler-tests.component').then(m => m.SchedulerTestsComponent)
      },
      {
        path: 'crops',
        loadComponent: () => import('./crops/crops-ref.component').then(m => m.CropsRefComponent)
      },
      {
        path: 'remboursements',
        loadComponent: () => import('./remboursements/remboursements-admin.component').then(m => m.RemboursementsAdminComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

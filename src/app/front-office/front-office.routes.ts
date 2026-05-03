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
        path: 'savings',
        loadComponent: () => import('./savings/savings.component').then(m => m.SavingsComponent)
      },
      {
        path: 'budget',
        loadComponent: () => import('./accounting/accounting.component').then(m => m.AccountingComponent)
      },
      {
        path: 'decision-dashboard',
        loadComponent: () => import('./decision-dashboard/decision-dashboard.component').then(m => m.DecisionDashboardComponent)
      },
      {
        path: 'marketplace',
        loadComponent: () => import('./marketplace/marketplace.component').then(m => m.MarketplaceComponent)
      },
      {
        path: 'marketplace/publish',
        loadComponent: () => import('./marketplace/publish/publish-listing.component').then(m => m.PublishListingComponent)
      },
      {
        path: 'marketplace/my-listings',
        loadComponent: () => import('./marketplace/my-listings/my-listings.component').then(m => m.MyListingsComponent)
      },
      {
        path: 'marketplace/my-orders',
        loadComponent: () => import('./marketplace/my-orders/my-orders.component').then(m => m.MyOrdersComponent)
      },
      {
        path: 'marketplace/my-sales',
        loadComponent: () => import('./marketplace/my-sales/my-sales.component').then(m => m.MySalesComponent)
      },
      {
        path: 'wallet',
        loadComponent: () => import('./wallet/wallet.component').then(m => m.WalletComponent)
      },
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];

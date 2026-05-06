import { Routes } from '@angular/router';
import { FrontOfficeComponent } from './front-office.component';
import { RiskAnalyzerComponent } from './dashboard/risk-analyzer/risk-analyzer.component';

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
        path: 'analyzer',
        component: RiskAnalyzerComponent
      },
      {
        path: 'risk-test',
        component: RiskAnalyzerComponent
      },
      {
        path: 'advisor',
        loadComponent: () => import('./dashboard/crop-recommendation/crop-recommendation.component').then(m => m.CropRecommendationComponent)
      },
      {
        path: 'assistant',
        loadComponent: () => import('./assistant/assistant.component').then(m => m.AssistantComponent)
      },
      {
        path: 'policies',
        loadComponent: () => import('./solidarity-fund/solidarity-fund.component').then(m => m.SolidarityFundComponent)
      },
      {
        path: 'claims',
        loadComponent: () => import('./indemnisation/indemnisation.component').then(m => m.IndemnisationComponent)
      },
      {
        path: 'declare-sinistre',
        loadComponent: () => import('./declare-sinistre/declare-sinistre.component').then(m => m.DeclareSinistreComponent)
      },
      {
        path: 'qcm',
        loadComponent: () => import('./qcm/qcm.component').then(m => m.QcmComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./payments/payments.component').then(m => m.PaymentsComponent)
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
        path: 'marketplace/listing/:id',
        loadComponent: () => import('./marketplace/listing-details/listing-details.component').then(m => m.ListingDetailsComponent)
      },
      {
        path: 'marketplace/edit/:id',
        loadComponent: () => import('./marketplace/edit/edit-listing.component').then(m => m.EditListingComponent)
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
      {
        path: 'credit',
        loadComponent: () => import('./credit/credit-page.component').then(m => m.CreditPageComponent)
      },
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];


import { Routes } from '@angular/router';

export const PAYMENT_ROUTES: Routes = [
  {
    path: 'pay/:insuranceId',
    loadComponent: () =>
      import('./components/payment-checkout/payment-checkout.component').then(m => m.PaymentCheckoutComponent),
    title: 'Paiement de la prime'
  },
  {
    path: 'regularize/:insuranceId',
    loadComponent: () =>
      import('./components/payment-checkout/payment-checkout.component').then(m => m.PaymentCheckoutComponent),
    data: { isRegularization: true },
    title: 'Régularisation'
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./components/payment-history/payment-history.component').then(m => m.PaymentHistoryComponent),
    title: 'Historique des paiements'
  },
  {
    path: 'success',
    loadComponent: () =>
      import('./components/payment-success/payment-success.component').then(m => m.PaymentSuccessComponent),
    title: 'Paiement réussi'
  },
  {
    path: 'cancel',
    loadComponent: () =>
      import('./components/payment-cancel/payment-cancel.component').then(m => m.PaymentCancelComponent),
    title: 'Paiement annulé'
  },
];

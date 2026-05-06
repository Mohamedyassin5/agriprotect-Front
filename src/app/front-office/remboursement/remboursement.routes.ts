// src/app/modules/remboursement/remboursement.routes.ts
import { Routes } from '@angular/router';

export const REMBOURSEMENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'mes-remboursements',
    pathMatch: 'full'
  },
  {
    path: 'mes-remboursements',
    loadComponent: () =>
      import('./components/farmer-mes-remboursements/farmer-mes-remboursements.component')
        .then(m => m.FarmerMesRemboursementsComponent),
    title: 'Mes Remboursements'
  },
   {
   
    path: 'creer',
    loadComponent: () =>
      import('./components/farmer-demande/farmer-creer-demande.component')
        .then(m => m.FarmerCreerDemandeComponent),
    title: 'Créer une demande'
  }
];
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="cancel-page">
      <div class="cancel-card">
        <div class="cancel-icon">❌</div>
        <h1 class="title">Paiement annulé</h1>
        <p class="subtitle">Le paiement a été annulé ou a échoué. Aucun montant n'a été débité.</p>
        <div class="actions">
          <a routerLink="/front-office/insurance/dashboard" class="btn-primary">
            Retour au tableau de bord
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { font-family: 'DM Sans', sans-serif; }
    .cancel-page {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #fef2f2, #f1f5f9);
      padding: 2rem;
    }
    .cancel-card {
      background: white; border-radius: 20px;
      padding: 3rem 2.5rem; max-width: 420px;
      width: 100%; text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
    }
    .cancel-icon { font-size: 3.5rem; margin-bottom: 1rem; }
    .title { font-size: 1.75rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem; }
    .subtitle { color: #64748b; font-size: 0.95rem; margin: 0 0 2rem; line-height: 1.6; }
    .btn-primary {
      display: block; padding: 0.85rem;
      background: #15803d; color: white;
      border-radius: 10px; text-decoration: none;
      font-weight: 600; transition: background 0.2s;
    }
    .btn-primary:hover { background: #14532d; }
  `]
})
export class PaymentCancelComponent {}

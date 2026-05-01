import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="success-page">
      <div class="success-card">
        <div class="check-circle">
          <svg viewBox="0 0 52 52" class="checkmark">
            <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        <h1 class="title">Paiement réussi !</h1>
        <p class="subtitle">Votre prime d'assurance a été enregistrée avec succès.</p>

        <div class="details-box" *ngIf="policyNumber || amount">
          <div class="detail-row" *ngIf="policyNumber">
            <span>Police</span><strong>{{ policyNumber }}</strong>
          </div>
          <div class="detail-row" *ngIf="amount">
            <span>Montant payé</span><strong>{{ amount | number:'1.2-2' }} TND</strong>
          </div>
          <div class="detail-row" *ngIf="intentId">
            <span>Référence</span>
            <strong class="mono">{{ intentId }}</strong>
          </div>
        </div>

        <p class="info-text">
          Un email de confirmation vous a été envoyé. La police sera mise à jour automatiquement.
        </p>

        <div class="actions">
          <a routerLink="/front-office/insurance/dashboard" class="btn-primary">
            Retour au tableau de bord
          </a>
          <a routerLink="/front-office/payment/history" class="btn-outline">
            Voir mes paiements
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=DM+Mono&display=swap');
    :host { font-family: 'DM Sans', sans-serif; }
    .success-page {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #f0fdf4, #f1f5f9);
      padding: 2rem;
    }
    .success-card {
      background: white;
      border-radius: 20px;
      padding: 3rem 2.5rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
    }
    .check-circle {
      width: 80px; height: 80px;
      margin: 0 auto 1.5rem;
    }
    .checkmark { width: 80px; height: 80px; }
    .checkmark-circle {
      stroke: #22c55e; stroke-width: 2;
      stroke-dasharray: 166; stroke-dashoffset: 166;
      animation: stroke 0.6s cubic-bezier(0.65,0,0.45,1) forwards;
    }
    .checkmark-check {
      stroke: #22c55e; stroke-width: 2.5;
      stroke-linecap: round; stroke-linejoin: round;
      stroke-dasharray: 48; stroke-dashoffset: 48;
      animation: stroke 0.3s cubic-bezier(0.65,0,0.45,1) 0.5s forwards;
    }
    @keyframes stroke {
      100% { stroke-dashoffset: 0; }
    }
    .title { font-size: 1.75rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem; }
    .subtitle { color: #64748b; margin: 0 0 1.5rem; font-size: 0.95rem; }
    .details-box {
      background: #f8fafc; border-radius: 12px;
      padding: 1.25rem; margin-bottom: 1.25rem;
      display: flex; flex-direction: column; gap: 0.6rem;
      text-align: left;
    }
    .detail-row { display: flex; justify-content: space-between; font-size: 0.9rem; }
    .detail-row span { color: #64748b; }
    .mono { font-family: 'DM Mono', monospace; font-size: 0.8rem; }
    .info-text { font-size: 0.82rem; color: #94a3b8; margin: 0 0 2rem; line-height: 1.6; }
    .actions { display: flex; flex-direction: column; gap: 0.75rem; }
    .btn-primary {
      display: block; padding: 0.85rem;
      background: #15803d; color: white;
      border-radius: 10px; text-decoration: none;
      font-weight: 600; font-size: 0.95rem;
      transition: background 0.2s;
    }
    .btn-primary:hover { background: #14532d; }
    .btn-outline {
      display: block; padding: 0.85rem;
      background: transparent; color: #334155;
      border: 1.5px solid #cbd5e1; border-radius: 10px;
      text-decoration: none; font-weight: 500; font-size: 0.9rem;
      transition: border-color 0.2s;
    }
    .btn-outline:hover { border-color: #94a3b8; }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  policyNumber: string | null = null;
  amount: number | null = null;
  intentId: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.policyNumber = this.route.snapshot.queryParamMap.get('policy');
    this.intentId = this.route.snapshot.queryParamMap.get('intentId');
    const a = this.route.snapshot.queryParamMap.get('amount');
    this.amount = a ? parseFloat(a) : null;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InsuranceService } from '../../services/insurance.service';
import { InsuranceResponse } from '../../models/insurance.models';

@Component({
  selector: 'app-insurance-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './insurance-detail.component.html',
  styleUrls: ['./insurance-detail.component.css']
})
export class InsuranceDetailComponent implements OnInit {
  insurance: InsuranceResponse | null = null;
  policy: InsuranceResponse | null = null;
  payments: any[] = [];
  loading = true;
  error: string | null = null;
  insuranceId!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: InsuranceService
  ) {}

  ngOnInit(): void {
    this.insuranceId = this.route.snapshot.paramMap.get('id')!;
    this.loadInsurance();
    this.loadPayments();
  }

  loadInsurance(): void {
    this.svc.getInsuranceById(this.insuranceId).subscribe({
      next: data => {
        this.insurance = data;
        this.policy = data;
        this.loading = false;
      },
      error: () => { this.error = 'Police introuvable.'; this.loading = false; }
    });
  }

  loadPayments(): void {
    this.svc.getPaymentsByInsurance(this.insuranceId).subscribe({
      next: data => this.payments = data,
      error: () => {}
    });
  }

  /**
   * Ouvre le certificat stylisé dans la langue choisie (FR / EN / AR).
   * Route attendue : /front-office/certificate/:id/:lang
   */
  downloadCert(lang: 'FR' | 'EN' | 'AR'): void {
    this.router.navigate(['/front-office/certificate', this.insuranceId, lang]);
  }

  initiatePayment(): void {
    this.svc.initiatePayment(this.insuranceId).subscribe({
      next: res => {
        console.log('Payment initiated:', res);
        alert(`Paiement initié. Total: ${res.totalAmount} ${res.currency}`);
      },
      error: () => alert('Erreur lors de l\'initiation du paiement.')
    });
  }

  regularize(): void {
    this.svc.regularize(this.insuranceId).subscribe({
      next: () => { this.loadInsurance(); alert('Police régularisée avec succès !'); },
      error: () => alert('Erreur lors de la régularisation.')
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'badge-active', PENDING_SIGNATURE: 'badge-pending',
      OVERDUE: 'badge-overdue', SUSPENDED: 'badge-suspended',
      COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled'
    };
    return map[status] || 'badge-default';
  }

  goToPayment(id: string): void {
    this.router.navigate(['/front-office/payment/pay', id]);
  }

  goToRegularize(id: string): void {
    this.router.navigate(['/front-office/payment/regularize', id]);
  }
  // Ajoutez ces propriétés si elles n'existent pas encore dans InsuranceResponse
// (ou étendez l'interface InsuranceResponse)

getPaymentProgress(): number {
  if (!this.insurance || !this.insurance.numberOfPayments) return 0;
  
  const completed = this.insurance.numberOfPayments - (this.insurance.remainingPayments || 0);
  return Math.round((completed / this.insurance.numberOfPayments) * 100);
}

isOverdue(): boolean {
  if (!this.insurance) return false;

  return this.insurance.overdue === true || 
         (this.insurance.penaltyAmount ?? 0) > 0;
}
getTotalPaid(): number {
  return this.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
}
}

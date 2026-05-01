import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { Payment } from '../../models/payment.models';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.css']
})
export class PaymentHistoryComponent implements OnInit {
  payments: Payment[] = [];
  loading = true;
  error: string | null = null;

  get totalPaid(): number {
    return this.payments
      .filter(p => p.status === 'SUCCEEDED')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }

  get totalPenalties(): number {
    return this.payments
      .filter(p => p.status === 'SUCCEEDED')
      .reduce((sum, p) => sum + (p.penaltyAmount || 0), 0);
  }

  constructor(private svc: PaymentService) {}

  ngOnInit(): void {
    this.svc.getMyPayments().subscribe({
      next: data => { this.payments = data; this.loading = false; },
      error: () => { this.error = 'Erreur de chargement.'; this.loading = false; }
    });
  }

  downloadInvoice(insuranceId: string, paymentId: string): void {
    this.svc.downloadInvoice(insuranceId).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture_${paymentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      SUCCEEDED: 'st-success',
      FAILED: 'st-failed',
      REFUNDED: 'st-refunded',
      PENDING: 'st-pending'
    };
    return map[status] || '';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      SUCCEEDED: '✅ Réussi',
      FAILED: '❌ Échoué',
      REFUNDED: '↩️ Remboursé',
      PENDING: '⏳ En attente'
    };
    return map[status] || status;
  }
}

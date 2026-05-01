import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { InsuranceService } from '../../services/insurance.service';
import { FarmerDashboard, InsuranceResponse, Payment, PaymentResponse } from '../../models/insurance.models';
import { InsuranceCertificateComponent } from '../insurance-certificate/insurance-certificate.component';
import { InsuranceInvoiceComponent } from '../insurance-invoice/insurance-invoice.component';

export type ActionModal = 'overdue' | 'suspended' | 'payments' | null;

@Component({
  selector: 'app-insurance-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, InsuranceCertificateComponent, InsuranceInvoiceComponent],
  templateUrl: './insurance-dashboard.component.html',
  styleUrls: ['./insurance-dashboard.component.css']
})
export class InsuranceDashboardComponent implements OnInit {
  dashboard: FarmerDashboard | null = null;
  policies: InsuranceResponse[] = [];
  loading = true;
  error: string | null = null;

  // ── Certificat modal ──────────────────────────────────────────────
  selectedCertPolicy: InsuranceResponse | null = null;
  showCertModal = false;

  // ── Invoice modal ─────────────────────────────────────────────────
  selectedInvoicePolicy: InsuranceResponse | null = null;
  showInvoiceModal = false;

  // ── Action modals (overdue / suspended / payments) ────────────────
  activeModal: ActionModal = null;

  /** Polices filtrées affichées dans la modale overdue ou suspended */
  modalPolicies: InsuranceResponse[] = [];

  /** Historique des paiements (modale payments) */
  allPayments: Payment[] = [];
  paymentsLoading = false;

  /** Paiement en cours (overdue / régularisation) */
  paymentLoading: Record<string, boolean> = {};
  paymentSuccess: Record<string, string> = {};
  paymentError: Record<string, string> = {};

  constructor(
    private insuranceService: InsuranceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadPolicies();
  }

  loadDashboard(): void {
    this.insuranceService.getFarmerDashboard().subscribe({
      next: data => { this.dashboard = data; this.loading = false; },
      error: () => { this.error = 'Erreur de chargement'; this.loading = false; }
    });
  }

  loadPolicies(): void {
    this.insuranceService.getAllMyInsurances().subscribe({
      next: data => this.policies = data,
      error: () => {}
    });
  }

  // ── Stat card click handlers ──────────────────────────────────────

  openOverdueModal(): void {
    if (!this.dashboard?.['overduePolicies']) return;
    this.paymentLoading = {};
    this.paymentSuccess = {};
    this.paymentError = {};
    this.openModal('overdue');
    this.insuranceService.getAllMyInsurances().subscribe({
      next: data => {
        this.policies = data;
        this.modalPolicies = data.filter(p => p.status === 'OVERDUE');
      },
      error: () => { this.modalPolicies = []; }
    });
  }

  openSuspendedModal(): void {
    if (!this.dashboard?.['suspendedPolicies']) return;
    this.paymentLoading = {};
    this.paymentSuccess = {};
    this.paymentError = {};
    this.openModal('suspended');
    this.insuranceService.getAllMyInsurances().subscribe({
      next: data => {
        this.policies = data;
        this.modalPolicies = data.filter(p => p.status === 'SUSPENDED');
      },
      error: () => { this.modalPolicies = []; }
    });
  }

  openPaymentsModal(): void {
  if (!this.dashboard) return;  // ← ouvre toujours si dashboard chargé
  this.openModal('payments');
  this.paymentsLoading = true;
  this.insuranceService.getMyPayments().subscribe({
    next: (data: any[]) => {
      this.allPayments = data as Payment[];
      this.paymentsLoading = false;
    },
    error: () => { this.paymentsLoading = false; }
  });
}

  // ── Payment actions ───────────────────────────────────────────────

payOverdue(policy: InsuranceResponse): void {
  this.closeModal();
  this.router.navigate(['/front-office/payment/regularize', policy.id]);
}

  regularize(policy: InsuranceResponse): void {
    this.closeModal();
    this.router.navigate(['/front-office/payment/regularize', policy.id]);
  }

  // ── Modal helpers ─────────────────────────────────────────────────

  private openModal(modal: ActionModal): void {
    this.activeModal = modal;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.activeModal = null;
    document.body.style.overflow = '';
  }

  onModalOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('action-modal-overlay')) {
      this.closeModal();
    }
  }

  // ── Certificat modal ──────────────────────────────────────────────

  downloadCertificate(policyId: string): void {
    const policy = this.policies.find(p => p.id === policyId);
    if (!policy) return;
    this.selectedCertPolicy = policy;
    this.showCertModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeCertModal(): void {
    this.showCertModal = false;
    this.selectedCertPolicy = null;
    document.body.style.overflow = '';
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('cert-modal-overlay')) {
      this.closeCertModal();
    }
  }

  // ── Invoice modal ─────────────────────────────────────────────────

  openInvoiceModal(policyId: string): void {
    const policy = this.policies.find(p => p.id === policyId);
    if (!policy) return;
    this.selectedInvoicePolicy = policy;
    this.showInvoiceModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeInvoiceModal(): void {
    this.showInvoiceModal = false;
    this.selectedInvoicePolicy = null;
    document.body.style.overflow = '';
  }

  onInvoiceOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('invoice-modal-overlay')) {
      this.closeInvoiceModal();
    }
  }

  downloadInvoice(id: string): void {
    this.insuranceService.downloadInvoice(id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'badge-active',
      PENDING_SIGNATURE: 'badge-pending',
      OVERDUE: 'badge-overdue',
      SUSPENDED: 'badge-suspended',
      COMPLETED: 'badge-completed',
      CANCELLED: 'badge-cancelled'
    };
    return map[status] || 'badge-default';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Active',
      PENDING_SIGNATURE: 'En attente de signature',
      OVERDUE: 'En retard',
      SUSPENDED: 'Suspendue',
      COMPLETED: 'Complétée',
      CANCELLED: 'Annulée'
    };
    return map[status] || status;
  }

  getPaymentStatusLabel(status: string): string {
    const map: Record<string, string> = {
      SUCCEEDED: 'Réussi',
      FAILED: 'Échoué',
      REFUNDED: 'Remboursé'
    };
    return map[status] || status;
  }

  getPaymentStatusClass(status: string): string {
    const map: Record<string, string> = {
      SUCCEEDED: 'badge-active',
      FAILED: 'badge-overdue',
      REFUNDED: 'badge-completed'
    };
    return map[status] || 'badge-default';
  }
}
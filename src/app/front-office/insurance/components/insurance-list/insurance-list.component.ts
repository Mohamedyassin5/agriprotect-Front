import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InsuranceService } from '../../services/insurance.service';
import { InsuranceResponse, InsuranceStatus } from '../../models/insurance.models';

@Component({
  selector: 'app-insurance-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './insurance-list.component.html',
  styleUrls: ['./insurance-list.component.css']
})
export class InsuranceListComponent implements OnInit {
  policies: InsuranceResponse[] = [];
  loading = true;
  error: string | null = null;

  constructor(private svc: InsuranceService) {}

  ngOnInit(): void {
    this.svc.getMyInsurances().subscribe({
      next: data => { this.policies = data; this.loading = false; },
      error: () => { this.error = 'Erreur de chargement.'; this.loading = false; }
    });
  }

  cancel(id: string): void {
    if (!confirm('Annuler cette police ?')) return;
    this.svc.cancelSubscription(id).subscribe({
      next: () => this.policies = this.policies.filter(p => p.id !== id),
      error: () => alert('Impossible d\'annuler cette police.')
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'badge-active', PENDING_SIGNATURE: 'badge-pending',
      OVERDUE: 'badge-overdue', SUSPENDED: 'badge-suspended',
      COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled'
    };
    return map[status] || '';
  }
}

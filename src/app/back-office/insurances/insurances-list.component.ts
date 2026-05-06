import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, InsuranceResponse } from '../admin.service';

@Component({
  selector: 'app-insurances-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './insurances-list.component.html',
  styleUrl: '../shared-backoffice.css'   // ou copie le CSS dans le dossier insurances/
})
export class InsurancesListComponent implements OnInit {
  private adminService = inject(AdminService);

  insurances: InsuranceResponse[] = [];
  loading = true;
  error: string | null = null;
  selectedStatus = '';

  readonly statusOptions = ['', 'ACTIVE', 'OVERDUE', 'SUSPENDED', 'COMPLETED', 'PENDING_SIGNATURE'];

  ngOnInit() { this.loadInsurances(); }

  loadInsurances() {
    this.loading = true;
    this.error = null;
    const status = this.selectedStatus || undefined;
    this.adminService.getAllInsurances(status).subscribe({
      next: (data) => { this.insurances = data; this.loading = false; },
      error: () => { this.error = 'Erreur lors du chargement des polices.'; this.loading = false; }
    });
  }

  onStatusChange() { this.loadInsurances(); }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'badge-active', OVERDUE: 'badge-overdue',
      SUSPENDED: 'badge-suspended', COMPLETED: 'badge-completed',
      PENDING_SIGNATURE: 'badge-pending'
    };
    return map[status] ?? 'badge-default';
  }
}

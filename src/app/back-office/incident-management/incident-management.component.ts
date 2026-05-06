import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../admin.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-incident-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incident-management.component.html',
  styleUrl: './incident-management.component.css'
})
export class IncidentManagementComponent implements OnInit {
  private adminService = inject(AdminService);

  risks: any[] = [];
  sinistres: any[] = [];
  loadingRisks = false;
  loadingSinistres = false;

  ngOnInit() {
    this.loadRisks();
    this.loadSinistres();
  }

  loadRisks() {
    this.loadingRisks = true;
    this.adminService.getUnresolvedRisks().subscribe({
      next: (data) => {
        this.risks = data;
        this.loadingRisks = false;
      },
      error: () => this.loadingRisks = false
    });
  }

  loadSinistres() {
    this.loadingSinistres = true;
    this.adminService.getUnresolvedSinistres().subscribe({
      next: (data) => {
        this.sinistres = data;
        this.loadingSinistres = false;
      },
      error: () => this.loadingSinistres = false
    });
  }

  resolveRisk(id: string) {
    if (confirm('Marquer ce risque comme résolu ?')) {
      this.adminService.resolveRisk(id).subscribe(() => {
        this.loadRisks();
      });
    }
  }

  resolveSinistre(id: string) {
    if (confirm('Clôturer cette déclaration de sinistre ?')) {
      this.adminService.resolveSinistre(id).subscribe(() => {
        this.loadSinistres();
      });
    }
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'HIGH': return 'badge-danger';
      case 'MEDIUM': return 'badge-warning';
      case 'LOW': return 'badge-info';
      default: return 'badge-secondary';
    }
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DemandeCreditApiService } from '../services/demande-credit-api.service';
import { CreditToastService } from '../services/credit-toast.service';
import type { DemandeCreditResponseDto, StatutDemande } from '../credit-workflow.models';

@Component({
  selector: 'app-demande-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './demande-list-page.component.html',
  styleUrl: './demande-list-page.component.css',
})
export class DemandeListPageComponent implements OnInit {
  private readonly api = inject(DemandeCreditApiService);
  private readonly toast = inject(CreditToastService);

  loading = true;
  rows: DemandeCreditResponseDto[] = [];

  statut?: StatutDemande | '';
  dateFrom = '';
  dateTo = '';
  qAgri = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api
      .getDemandesFiltered({
        page: 0,
        size: 100,
        sortBy: 'id',
        direction: 'desc',
        statut: this.statut || undefined,
        dateFrom: this.dateFrom || undefined,
        dateTo: this.dateTo || undefined,
      })
      .subscribe({
        next: (list) => {
          const qa = this.qAgri.trim().toLowerCase();
          this.rows = qa
            ? list.filter((d) => String(d.agriculteurId).includes(qa) || (d.description ?? '').toLowerCase().includes(qa))
            : list;
          this.loading = false;
        },
        error: () => {
          this.toast.error('Impossible de charger les demandes.');
          this.loading = false;
        },
      });
  }

  badgeClass(s: StatutDemande): string {
    switch (s) {
      case 'NOUVELLE':
        return 'cw-badge cw-badge-neutral';
      case 'EN_COURS_INSTRUCTION':
        return 'cw-badge cw-badge-info';
      case 'ACCEPTEE':
        return 'cw-badge cw-badge-success';
      case 'REJETEE':
        return 'cw-badge cw-badge-danger';
      case 'ANNULEE':
        return 'cw-badge cw-badge-muted';
      case 'ARCHIVEE':
        return 'cw-badge cw-badge-muted';
      default:
        return 'cw-badge cw-badge-neutral';
    }
  }

  resetFilters(): void {
    this.statut = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.qAgri = '';
    this.load();
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RisqueService, Risk } from '../../../core/services/risque.service';
import { SinistreService, SinistreResponse } from '../../../core/services/sinistre.service';

@Component({
  selector: 'app-incidents-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './incidents-table.component.html',
  styleUrls: ['./incidents-table.component.css']
})
export class IncidentsTableComponent implements OnInit {
  private risqueService = inject(RisqueService);
  private sinistreService = inject(SinistreService);

  risques: Risk[] = [];
  sinistres: SinistreResponse[] = [];
  
  loadingRisques = true;
  loadingSinistres = true;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadingRisques = true;
    this.loadingSinistres = true;

    this.risqueService.getUnresolvedRisks().subscribe({
      next: (data: Risk[]) => {
        this.risques = data || [];
        this.loadingRisques = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement risques', err);
        this.loadingRisques = false;
      }
    });

    this.sinistreService.getUnresolvedSinistres().subscribe({
      next: (data: SinistreResponse[]) => {
        this.sinistres = data || [];
        this.loadingSinistres = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement sinistres', err);
        this.loadingSinistres = false;
      }
    });
  }

  resolveRisque(id: string) {
    if (confirm('Êtes-vous sûr de vouloir marquer ce risque comme résolu ? L\'agriculteur recevra un email de confirmation.')) {
      this.risqueService.resolveRisk(id).subscribe({
        next: () => {
          alert('Risque résolu avec succès !');
          this.loadData();
        },
        error: (err: any) => alert('Erreur lors de la résolution du risque.')
      });
    }
  }

  resolveSinistre(id: string) {
    if (confirm('Êtes-vous sûr de vouloir clôturer ce sinistre ? L\'agriculteur recevra un email de confirmation.')) {
      this.sinistreService.resolveSinistre(id).subscribe({
        next: () => {
          alert('Sinistre clôturé avec succès !');
          this.loadData();
        },
        error: (err: any) => alert('Erreur lors de la clôture du sinistre.')
      });
    }
  }
}

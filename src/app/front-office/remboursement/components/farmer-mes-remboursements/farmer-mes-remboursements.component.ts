import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { RemboursementService } from '../../services/remboursement.service';
import { Remboursement, StatutRemboursement } from '../../models/remboursement.models';

@Component({
  selector: 'app-farmer-mes-remboursements',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './farmer-mes-remboursements.component.html',
  styleUrls: ['./farmer-mes-remboursements.component.css']
})
export class FarmerMesRemboursementsComponent implements OnInit {

  remboursements: Remboursement[] = [];
  loading = true;
  error: string | null = null;

  // Annulation
  annulationEnCours: string | null = null;  // ID du remboursement en cours d'annulation
  annulationSuccess: string | null = null;  // Message de succès

  constructor(
    private remboursementService: RemboursementService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRemboursements();
  }

  loadRemboursements(): void {
    this.loading = true;
    this.error = null;

    this.remboursementService.getMesRemboursements().subscribe({
      next: (data) => {
        // Tri : EN_ATTENTE en premier, puis par date décroissante
        this.remboursements = data.sort((a, b) => {
          if (a.statut === 'EN_ATTENTE' && b.statut !== 'EN_ATTENTE') return -1;
          if (b.statut === 'EN_ATTENTE' && a.statut !== 'EN_ATTENTE') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement:', err);
        this.error = 'Impossible de charger vos remboursements. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  // ── Annulation d'une demande EN_ATTENTE ─────────────────────────────────────

  annuler(remboursement: Remboursement): void {
    if (!confirm('Confirmer l\'annulation de cette demande ?')) return;

    this.annulationEnCours = remboursement.id;
    this.annulationSuccess = null;
    this.error = null;

    this.remboursementService.annulerRemboursement(remboursement.id).subscribe({
      next: (res) => {
        // Mise à jour locale sans rechargement
        const idx = this.remboursements.findIndex(r => r.id === remboursement.id);
        if (idx !== -1) {
          this.remboursements[idx] = { ...this.remboursements[idx], statut: 'ANNULE' };
        }
        this.annulationEnCours = null;
        this.annulationSuccess = res.message || 'Demande annulée avec succès.';
        setTimeout(() => this.annulationSuccess = null, 4000);
      },
      error: (err) => {
        this.annulationEnCours = null;
        this.error = err.error?.message || 'Impossible d\'annuler cette demande.';
      }
    });
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  creerDemande(): void {
    this.router.navigate(['/front-office/remboursement/creer']);
  }

  // ── Helpers statut ───────────────────────────────────────────────────────────

  getStatutClass(statut: StatutRemboursement): string {
    const map: Record<StatutRemboursement, string> = {
      EN_ATTENTE: 'badge-pending',
      APPROUVE:   'badge-approved',
      REFUSE:     'badge-refused',
      PAYE:       'badge-paid',
      ANNULE:     'badge-cancelled'
    };
    return map[statut] || '';
  }

  getStatutLabel(statut: StatutRemboursement): string {
    const map: Record<StatutRemboursement, string> = {
      EN_ATTENTE: '⏳ En attente',
      APPROUVE:   '✅ Approuvé',
      REFUSE:     '❌ Refusé',
      PAYE:       '💳 Payé',
      ANNULE:     '🚫 Annulé'
    };
    return map[statut] || statut;
  }

  peutAnnuler(r: Remboursement): boolean {
    return r.statut === 'EN_ATTENTE';
  }
}

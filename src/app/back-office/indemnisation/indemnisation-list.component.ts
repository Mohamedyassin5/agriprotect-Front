import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IndemnisationService, PendingRequestDTO } from '../../core/services/indemnisation.service';

@Component({
  selector: 'app-indemnisation-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './indemnisation-list.component.html',
  styleUrls: ['./indemnisation-list.component.css']
})
export class IndemnisationListComponent implements OnInit {
  private indemnisationService = inject(IndemnisationService);

  requests: PendingRequestDTO[] = [];
  loading = true;
  processingId: string | null = null;
  
  refusalReason = '';
  showRefusalInputFor: string | null = null;

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.loading = true;
    this.indemnisationService.getPendingRequests().subscribe({
      next: (data) => {
        this.requests = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading pending requests', err);
        this.loading = false;
      }
    });
  }

  approveRequest(id: string) {
    if (!confirm("Voulez-vous vraiment approuver cette demande et indemniser l'agriculteur ?")) return;

    this.processingId = id;
    this.indemnisationService.processRequest(id, true).subscribe({
      next: () => {
        alert('Demande approuvée avec succès !');
        this.loadRequests();
        this.processingId = null;
      },
      error: (err) => {
        alert('Erreur: ' + (err.error || 'Traitement impossible'));
        this.processingId = null;
      }
    });
  }

  startRefusal(id: string) {
    this.showRefusalInputFor = id;
    this.refusalReason = '';
  }

  cancelRefusal() {
    this.showRefusalInputFor = null;
    this.refusalReason = '';
  }

  submitRefusal(id: string) {
    if (!this.refusalReason.trim()) {
      alert('Veuillez fournir une raison pour le refus.');
      return;
    }

    if (!confirm('Confirmer le refus de cette demande ?')) return;

    this.processingId = id;
    this.indemnisationService.processRequest(id, false, this.refusalReason).subscribe({
      next: () => {
        alert('Demande refusée.');
        this.showRefusalInputFor = null;
        this.loadRequests();
        this.processingId = null;
      },
      error: (err) => {
        alert('Erreur: ' + (err.error || 'Traitement impossible'));
        this.processingId = null;
      }
    });
  }

  getScoreClass(score: number) {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  }
}

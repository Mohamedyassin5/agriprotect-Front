import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvestigationService, Investigation } from '../../core/services/investigation.service';

@Component({
  selector: 'app-investigations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './investigations.component.html',
  styleUrls: ['./investigations.component.css']
})
export class InvestigationsComponent implements OnInit {
  private investigationService = inject(InvestigationService);

  investigations: Investigation[] = [];
  loading = true;
  processingId: string | null = null;
  
  decisionReason = '';
  showDecisionFormFor: string | null = null;
  decisionType: 'ACCEPT' | 'REFUSE' | null = null;

  ngOnInit() {
    this.loadInvestigations();
  }

  loadInvestigations() {
    this.loading = true;
    this.investigationService.getAssignedInvestigations().subscribe({
      next: (data) => {
        this.investigations = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading investigations', err);
        this.loading = false;
      }
    });
  }

  startDecision(id: string, type: 'ACCEPT' | 'REFUSE') {
    this.showDecisionFormFor = id;
    this.decisionType = type;
    this.decisionReason = '';
  }

  cancelDecision() {
    this.showDecisionFormFor = null;
    this.decisionType = null;
    this.decisionReason = '';
  }

  submitDecision(id: string) {
    if (!this.decisionReason.trim()) {
      alert('Veuillez fournir un rapport détaillé pour votre décision.');
      return;
    }

    const isAccepted = this.decisionType === 'ACCEPT';
    const confirmMsg = isAccepted 
      ? 'Confirmer les résultats de cette investigation comme VALIDES ?' 
      : 'Confirmer le REJET de cette investigation ?';

    if (!confirm(confirmMsg)) return;

    this.processingId = id;
    this.investigationService.decideOnInvestigation(id, {
      accepted: isAccepted,
      decisionReason: this.decisionReason
    }).subscribe({
      next: () => {
        alert("Rapport d'investigation soumis avec succès.");
        this.showDecisionFormFor = null;
        this.decisionType = null;
        this.loadInvestigations();
        this.processingId = null;
      },
      error: (err) => {
        alert('Erreur: ' + (err.error || 'Soumission impossible'));
        this.processingId = null;
      }
    });
  }

  getStatusClass(status: string) {
    switch(status) {
      case 'PENDING':   return 'status-pending';
      case 'ACCEPTED':  return 'status-completed';
      case 'REFUSED':   return 'status-rejected';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'PENDING':   return '⏳ En attente';
      case 'ACCEPTED':  return '✅ Validé';
      case 'REFUSED':   return '❌ Rejeté';
      default: return status;
    }
  }

  getPendingCount(): number {
    return this.investigations.filter(i => i.status === 'PENDING').length;
  }

  getCompletedCount(): number {
    return this.investigations.filter(i => i.status !== 'PENDING').length;
  }
}

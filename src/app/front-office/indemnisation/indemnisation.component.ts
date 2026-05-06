import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IndemnisationService, IndemnisationRequest } from '../../core/services/indemnisation.service';
import { InvestigationService } from '../../core/services/investigation.service';
import { SinistreService, SinistreResponse } from '../../core/services/sinistre.service';
import { UserService } from '../profile/user.service';

@Component({
  selector: 'app-indemnisation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './indemnisation.component.html',
  styleUrls: ['./indemnisation.component.css']
})
export class IndemnisationComponent implements OnInit {
  private indemnisationService = inject(IndemnisationService);
  private investigationService = inject(InvestigationService);
  private sinistreService = inject(SinistreService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  history: IndemnisationRequest[] = [];
  memberships: any[] = [];
  mySinistres: SinistreResponse[] = [];
  selectedSinistre: SinistreResponse | null = null;

  loading = true;
  activeTab: 'new' | 'history' = 'new';

  showForm = false;
  claimForm: FormGroup;
  submitting = false;

  // Appeal modal
  appealModal: { visible: boolean; requestId: string; requestName: string } = { visible: false, requestId: '', requestName: '' };
  appealForm: FormGroup;
  submittingAppeal = false;

  constructor() {
    this.claimForm = this.fb.group({
      sinistreId: ['', Validators.required],
      fundId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      damageType: ['RECOLTE', Validators.required],
      affectedArea: ['', [Validators.required, Validators.min(0.01)]],
      farmerNotes: ['', [Validators.required, Validators.minLength(10)]]
    });
    this.appealForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(20)]]
    });

    // When sinistre changes, update the selectedSinistre preview
    this.claimForm.get('sinistreId')?.valueChanges.subscribe(id => {
      this.selectedSinistre = this.mySinistres.find(s => s.id === id) || null;
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.indemnisationService.getMyHistory().subscribe({
      next: (data) => {
        this.history = data;
        this.loadMemberships();
      },
      error: (err) => {
        console.error('Error loading history', err);
        this.loading = false;
      }
    });
  }

  loadMemberships() {
    this.indemnisationService.getMyMemberships().subscribe({
      next: (data) => {
        this.memberships = data;
        this.loadSinistres();
      },
      error: (err) => {
        console.error('Error loading memberships', err);
        this.loading = false;
      }
    });
  }

  loadSinistres() {
    this.sinistreService.getMySinistres().subscribe({
      next: (data) => {
        // Only show unresolved sinistres
        this.mySinistres = data.filter(s => !s.isResolved);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading sinistres', err);
        this.loading = false;
      }
    });
  }

  submitClaim() {
    if (this.claimForm.invalid) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    this.submitting = true;
    
    // GetRawValue to include disabled fields (like amount)
    const val = this.claimForm.getRawValue();

    this.indemnisationService.submitRequest(
      val.fundId,
      val.amount,
      val.sinistreId,
      val.farmerNotes,
      val.damageType,
      val.affectedArea
    )
      .subscribe({
        next: () => {
          alert('Demande soumise avec succès ! Notre IA va analyser votre dossier.');
          this.showForm = false;
          this.claimForm.reset();
          this.selectedSinistre = null;
          this.loadData();
          this.submitting = false;
        },
        error: (err) => {
          alert('Erreur: ' + (err.error || 'Impossible de soumettre la demande.'));
          this.submitting = false;
        }
      });
  }

  // Appeal methods
  openAppeal(requestId: string, fundName?: string) {
    this.appealModal = { visible: true, requestId, requestName: fundName || 'Fonds inconnu' };
    this.appealForm.reset({ description: '' });
  }

  closeAppeal() {
    this.appealModal = { visible: false, requestId: '', requestName: '' };
  }

  submitAppeal() {
    if (this.appealForm.invalid) return;
    this.submittingAppeal = true;
    const { description } = this.appealForm.value;
    this.investigationService.fileInvestigation({
      requestId: this.appealModal.requestId,
      type: 'RECLAMATION',
      description
    }).subscribe({
      next: () => {
        this.submittingAppeal = false;
        this.closeAppeal();
        this.loadData();
        this.userService.loadProfile();
        alert('Votre contestation a été soumise. Un expert va analyser votre dossier.');
      },
      error: (err) => {
        alert('Erreur: ' + (err.error || 'Impossible de soumettre la contestation.'));
        this.submittingAppeal = false;
      }
    });
  }

  getSinistreLabel(s: SinistreResponse): string {
    const date = new Date(s.dateCatastrophe).toLocaleDateString('fr-FR');
    return `${s.typeSinistre} — ${s.cropType} (${date})`;
  }

  getStatusClass(status: string) {
    switch(status) {
      case 'PENDING':  return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REFUSED':  return 'status-refused';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'PENDING':  return '⏳ En attente';
      case 'APPROVED': return '✅ Approuvée';
      case 'REFUSED':  return '❌ Refusée';
      default: return status;
    }
  }

  getHeaderClass(status: string): string {
    switch(status) {
      case 'APPROVED': return 'header-approved';
      case 'REFUSED':  return 'header-refused';
      default:         return 'header-pending';
    }
  }

  getSelectedFundBalance(): number {
    const fundId = this.claimForm.get('fundId')?.value;
    if (!fundId) return -1;
    const membership = this.memberships.find(m => m.solidarityFund.id === fundId);
    return membership ? membership.solidarityFund.currentBalance : -1;
  }

  getCalculatedAmount(): number {
    return this.claimForm.get('amount')?.value || 0;
  }

  isAmountExceedingBalance(): boolean {
    const bal = this.getSelectedFundBalance();
    const amt = this.getCalculatedAmount();
    return bal >= 0 && amt > bal;
  }

  getScoreClass(score?: number): string {
    if (score === undefined || score === null) return 'ai-box-low';
    if (score >= 70) return 'ai-box-high';
    if (score >= 40) return 'ai-box-medium';
    return 'ai-box-low';
  }
}

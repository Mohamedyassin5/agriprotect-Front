import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IndemnisationService, IndemnisationRequest } from '../../core/services/indemnisation.service';
import { InvestigationService } from '../../core/services/investigation.service';
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
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  history: IndemnisationRequest[] = [];
  memberships: any[] = [];
  loading = true;
  activeTab: 'new' | 'history' = 'new';

  showForm = false;
  claimForm: FormGroup;
  selectedFile: File | null = null;
  submitting = false;

  // Appeal modal
  appealModal: { visible: boolean; requestId: string; requestName: string } = { visible: false, requestId: '', requestName: '' };
  appealForm: FormGroup;
  submittingAppeal = false;

  constructor() {
    this.claimForm = this.fb.group({
      fundId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      reason: ['', Validators.required]
    });
    this.appealForm = this.fb.group({
      type: ['RECLAMATION', Validators.required],
      description: ['', [Validators.required, Validators.minLength(20)]]
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
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading memberships', err);
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  submitClaim() {
    if (this.claimForm.invalid || !this.selectedFile) {
      alert('Veuillez remplir tous les champs et ajouter une image des dégâts.');
      return;
    }

    this.submitting = true;
    const val = this.claimForm.value;

    this.indemnisationService.submitRequest(val.fundId, val.amount, val.reason, this.selectedFile)
      .subscribe({
        next: (res) => {
          alert('Demande soumise avec succès ! Notre IA va analyser votre dossier.');
          this.showForm = false;
          this.claimForm.reset();
          this.selectedFile = null;
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
  openAppeal(requestId: string, fundName: string) {
    this.appealModal = { visible: true, requestId, requestName: fundName };
    this.appealForm.reset({ type: 'RECLAMATION', description: '' });
  }

  closeAppeal() {
    this.appealModal = { visible: false, requestId: '', requestName: '' };
  }

  submitAppeal() {
    if (this.appealForm.invalid) return;
    this.submittingAppeal = true;
    const { type, description } = this.appealForm.value;
    this.investigationService.fileInvestigation({
      requestId: this.appealModal.requestId,
      type,
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

  getScoreClass(score: number): string {
    if (score >= 70) return 'ai-box-high';
    if (score >= 40) return 'ai-box-medium';
    return 'ai-box-low';
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { DemandeCreditApiService } from '../services/demande-credit-api.service';
import { CreditApiService } from '../services/credit-api.service';
import { CreditToastService } from '../services/credit-toast.service';
import { CreditActivityLogService } from '../services/credit-activity-log.service';
import { CwWorkflowStepperComponent } from '../components/cw-workflow-stepper.component';
import { previewCreditScore } from '../utils/credit-score.util';
import {
  canAnalyzeOrFinalize,
  canCancel,
  canCreateAnalyse,
  canCreateCredit,
  canDeleteDemande,
  canEditDemande,
  canStartInstruction,
  canArchive,
} from '../utils/credit-ui-rules';
import type {
  AnalyseRentabiliteResponseDto,
  CreditResponseDto,
  DemandeCreditResponseDto,
  DecisionCredit,
  EcheanceResponseDto,
  StatutDemande,
  StatutEcheance,
} from '../credit-workflow.models';

@Component({
  selector: 'app-demande-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, CwWorkflowStepperComponent],
  templateUrl: './demande-detail-page.component.html',
  styleUrl: './demande-detail-page.component.css',
})
export class DemandeDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly demandeApi = inject(DemandeCreditApiService);
  private readonly creditApi = inject(CreditApiService);
  private readonly toast = inject(CreditToastService);
  private readonly activity = inject(CreditActivityLogService);

  loading = true;
  id!: number;
  demande!: DemandeCreditResponseDto;
  analyse: AnalyseRentabiliteResponseDto | null = null;
  credit: CreditResponseDto | null = null;
  echeances: EcheanceResponseDto[] = [];

  editOpen = false;
  finalizeOpen = false;
  payTarget: EcheanceResponseDto | null = null;

  editForm = this.fb.group({
    dateDemande: ['', Validators.required],
    montantDemande: [null as number | null, Validators.required],
    description: [''],
  });

  analyseForm = this.fb.group({
    revenuBrut: [0, [Validators.required, Validators.min(0)]],
    coutTotal: [0, [Validators.required, Validators.min(0)]],
    decision: ['EN_ATTENTE' as DecisionCredit, Validators.required],
    commentaire: [''],
  });

  creditForm = this.fb.group({
    montant: [null as number | null, Validators.required],
    tauxInteret: [7.5, Validators.required],
    dureeMois: [36, [Validators.required, Validators.min(1)]],
    dateDebut: [new Date().toISOString().slice(0, 10), Validators.required],
    assuranceId: [null as number | null],
  });

  finalizeForm = this.fb.group({
    decision: ['ACCEPTEE' as DecisionCredit, Validators.required],
    commentaire: [''],
  });

  payForm = this.fb.group({
    montantPaye: [null as number | null, Validators.required],
    datePaiement: [new Date().toISOString().slice(0, 10)],
    referencePaiement: [''],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = Number(idParam);
    if (!Number.isFinite(this.id)) {
      this.router.navigate(['/back-office/credit/demandes']);
      return;
    }
    this.reload();
    this.analyseForm.valueChanges.subscribe(() => {});
  }

  reload(): void {
    this.loading = true;
    forkJoin({
      demande: this.demandeApi.getDemande(this.id),
      analyse: this.demandeApi.getAnalyse(this.id).pipe(catchError(() => of(null))),
      credit: this.demandeApi.getCreditByDemande(this.id).pipe(catchError(() => of(null))),
    })
      .pipe(
        switchMap(({ demande, analyse, credit }) => {
          this.demande = demande;
          this.analyse = analyse;
          this.credit = credit;
          if (!credit) {
            return of([] as EcheanceResponseDto[]);
          }
          return this.creditApi.getEcheances(credit.id).pipe(catchError(() => of([])));
        })
      )
      .subscribe({
        next: (ech) => {
          this.echeances = ech;
          this.editForm.patchValue({
            dateDemande: this.demande.dateDemande,
            montantDemande: this.demande.montantDemande,
            description: this.demande.description ?? '',
          });
          if (this.demande.statut === 'ACCEPTEE' && !this.credit) {
            this.creditForm.patchValue({ montant: this.demande.montantDemande ?? undefined });
          }
          if (this.analyse) {
            this.analyseForm.patchValue({
              revenuBrut: this.analyse.revenuBrut,
              coutTotal: this.analyse.coutTotal,
              decision: this.analyse.decision,
              commentaire: this.analyse.commentaire ?? '',
            });
          }
          this.loading = false;
        },
        error: () => {
          this.toast.error('Dossier introuvable.');
          this.router.navigate(['/back-office/credit/demandes']);
        },
      });
  }

  scorePreview() {
    const v = this.analyseForm.getRawValue();
    const md = this.demande?.montantDemande ?? 0;
    return previewCreditScore({
      revenuBrut: Number(v.revenuBrut),
      coutTotal: Number(v.coutTotal),
      montantDemande: md,
    });
  }

  recommendationLabel(rec?: string): { icon: string; label: string; cls: string } {
    switch (rec) {
      case 'AUTO_ACCEPT':
        return { icon: '✅', label: 'Acceptation automatique', cls: 'cw-rec-ok' };
      case 'MANUAL_REVIEW':
        return { icon: '⚠️', label: 'Revue manuelle', cls: 'cw-rec-warn' };
      case 'AUTO_REJECT':
        return { icon: '❌', label: 'Refus automatique', cls: 'cw-rec-bad' };
      default:
        return { icon: '•', label: rec || '—', cls: 'cw-rec-muted' };
    }
  }

  riskLabel(score: number): { label: string; cls: string } {
    if (score >= 75) return { label: 'Risque faible', cls: 'cw-risk-low' };
    if (score >= 55) return { label: 'Risque modéré', cls: 'cw-risk-mid' };
    return { label: 'Risque élevé', cls: 'cw-risk-high' };
  }

  timeline(): { at: string; label: string; detail?: string }[] {
    const items: { at: string; label: string; detail?: string }[] = [];
    items.push({ at: this.demande.dateDemande, label: 'Demande créée', detail: `Montant ${this.demande.montantDemande} TND` });
    if (this.analyse?.dateAnalyse) {
      items.push({
        at: this.analyse.dateAnalyse,
        label: 'Analyse de rentabilité',
        detail: `Décision ${this.analyse.decision}`,
      });
    }
    if (this.credit?.referenceContrat) {
      items.push({ at: this.credit.dateDebut, label: 'Crédit octroyé', detail: this.credit.referenceContrat });
    }
    for (const a of this.activity.list(this.id)) {
      items.push({ at: a.at, label: a.label, detail: a.detail });
    }
    return items.sort((x, y) => (x.at < y.at ? 1 : -1));
  }

  // rules
  canEdit = () => canEditDemande(this.demande.statut);
  canDelete = () => canDeleteDemande(this.demande.statut);
  canStart = () => canStartInstruction(this.demande.statut);
  canInstr = () => canAnalyzeOrFinalize(this.demande.statut);
  canAnalyse = () => canCreateAnalyse(this.demande.statut, !!this.analyse);
  canCredit = () => canCreateCredit(this.demande.statut, !!this.credit);
  canArch = () => canArchive(this.demande.statut);
  canCancel = () => canCancel(this.demande.statut);

  showAnalyseForm(): boolean {
    if (!this.demande) return false;
    if (this.analyse) return true;
    return this.demande.statut === 'EN_COURS_INSTRUCTION' && canCreateAnalyse(this.demande.statut, false);
  }

  badgeClass(s: StatutDemande): string {
    const map: Record<string, string> = {
      NOUVELLE: 'cw-badge cw-badge-neutral',
      EN_COURS_INSTRUCTION: 'cw-badge cw-badge-info',
      ACCEPTEE: 'cw-badge cw-badge-success',
      REJETEE: 'cw-badge cw-badge-danger',
      ANNULEE: 'cw-badge cw-badge-muted',
      ARCHIVEE: 'cw-badge cw-badge-muted',
    };
    return map[s] ?? 'cw-badge cw-badge-neutral';
  }

  echeanceClass(st: StatutEcheance): string {
    switch (st) {
      case 'A_VENIR':
        return 'cw-es cw-es-blue';
      case 'PAYEE_A_TEMPS':
      case 'PAYEE_EN_RETARD':
      case 'PAYEE_PARTIELLEMENT':
        return 'cw-es cw-es-green';
      case 'ECHUE_NON_PAYEE':
      case 'IMPAYEE_DEFINITIVE':
        return 'cw-es cw-es-red';
      default:
        return 'cw-es cw-es-muted';
    }
  }

  saveEdit(): void {
    if (this.editForm.invalid) return;
    const v = this.editForm.getRawValue();
    this.demandeApi
      .updateDemande(this.id, {
        dateDemande: v.dateDemande!,
        montantDemande: Number(v.montantDemande),
        description: v.description?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success('Demande mise à jour.');
          this.editOpen = false;
          this.reload();
        },
        error: () => this.toast.error('Modification refusée par le serveur.'),
      });
  }

  deleteDemande(): void {
    if (!confirm('Supprimer définitivement cette demande ?')) return;
    this.demandeApi.deleteDemande(this.id).subscribe({
      next: () => {
        this.toast.success('Demande supprimée.');
        this.router.navigate(['/back-office/credit/demandes']);
      },
      error: () => this.toast.error('Suppression impossible (statut).'),
    });
  }

  startInstruction(): void {
    this.demandeApi.startInstruction(this.id).subscribe({
      next: () => {
        this.toast.success('Instruction démarrée.');
        this.activity.append(this.id, { label: 'Instruction démarrée' });
        this.reload();
      },
      error: () => this.toast.error('Transition invalide.'),
    });
  }

  submitFinalize(): void {
    const v = this.finalizeForm.getRawValue();
    this.demandeApi
      .finaliserDecision(this.id, {
        decision: v.decision!,
        commentaire: v.commentaire?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success('Décision enregistrée.');
          this.finalizeOpen = false;
          this.activity.append(this.id, { label: 'Décision finalisée', detail: v.decision! });
          this.reload();
        },
        error: () => this.toast.error('Impossible de finaliser.'),
      });
  }

  submitAnalyse(): void {
    if (this.analyseForm.invalid) {
      this.analyseForm.markAllAsTouched();
      return;
    }
    const v = this.analyseForm.getRawValue();
    const dto = {
      revenuBrut: Number(v.revenuBrut),
      coutTotal: Number(v.coutTotal),
      decision: v.decision!,
      commentaire: v.commentaire?.trim() || undefined,
    };
    const req$ = this.analyse
      ? this.demandeApi.updateAnalyse(this.analyse.id, dto)
      : this.demandeApi.creerAnalyse(this.id, dto);
    req$.subscribe({
      next: () => {
        this.toast.success(this.analyse ? 'Analyse mise à jour.' : 'Analyse créée.');
        this.activity.append(this.id, { label: this.analyse ? 'Analyse mise à jour' : 'Analyse créée' });
        this.reload();
      },
      error: (e) => this.toast.error(e?.error?.message || 'Analyse refusée (règles métier).'),
    });
  }

  submitCredit(): void {
    if (this.creditForm.invalid) return;
    const v = this.creditForm.getRawValue();
    this.demandeApi
      .creerCreditDepuisDemande(this.id, {
        montant: Number(v.montant),
        tauxInteret: Number(v.tauxInteret),
        dureeMois: Number(v.dureeMois),
        dateDebut: v.dateDebut!,
        assuranceId: v.assuranceId ?? undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success('Crédit créé.');
          this.activity.append(this.id, { label: 'Crédit octroyé' });
          this.reload();
        },
        error: () => this.toast.error('Création crédit refusée.'),
      });
  }

  generateSchedule(): void {
    if (!this.credit) return;
    if (!confirm("Générer l'échéancier ? Opération unique.")) return;
    this.creditApi.genererEcheancier(this.credit.id).subscribe({
      next: () => {
        this.toast.success('Échéancier généré.');
        this.activity.append(this.id, { label: 'Échéancier généré' });
        this.reload();
      },
      error: () => this.toast.error('Impossible de générer (déjà créé ?).'),
    });
  }

  openPay(e: EcheanceResponseDto): void {
    this.payTarget = e;
    const reste = Math.max(0, (e.montantDu ?? 0) - (e.montantPaye ?? 0));
    this.payForm.patchValue({
      montantPaye: reste,
      datePaiement: new Date().toISOString().slice(0, 10),
      referencePaiement: '',
    });
  }

  submitPay(): void {
    if (!this.payTarget || this.payForm.invalid) return;
    const v = this.payForm.getRawValue();
    this.creditApi
      .enregistrerPaiement(this.payTarget.id, {
        montantPaye: Number(v.montantPaye),
        datePaiement: v.datePaiement || undefined,
        referencePaiement: v.referencePaiement?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success('Paiement enregistré.');
          this.payTarget = null;
          this.reload();
        },
        error: () => this.toast.error('Paiement refusé.'),
      });
  }

  archive(): void {
    if (!confirm('Archiver ce dossier ?')) return;
    this.demandeApi.archiveDemande(this.id).subscribe({
      next: () => {
        this.toast.success('Dossier archivé.');
        this.reload();
      },
      error: () => this.toast.error('Archivage impossible.'),
    });
  }

  cancelDemande(): void {
    if (!confirm('Annuler cette demande ?')) return;
    this.demandeApi.cancelDemande(this.id).subscribe({
      next: () => {
        this.toast.success('Demande annulée.');
        this.reload();
      },
      error: () => this.toast.error('Annulation impossible.'),
    });
  }

  nextActionHint(): string {
    const st = this.demande.statut;
    if (st === 'NOUVELLE') return 'Démarrez l’instruction ou modifiez la demande.';
    if (st === 'EN_COURS_INSTRUCTION') return 'Complétez l’analyse ou finalisez la décision.';
    if (st === 'ACCEPTEE' && !this.credit) return 'Octroyez le crédit pour poursuivre.';
    if (this.credit && this.echeances.length === 0) return 'Générez l’échéancier.';
    if (this.credit && this.echeances.length) return 'Suivez les paiements sur les échéances.';
    return 'Consultez le rapport et les indicateurs.';
  }
}

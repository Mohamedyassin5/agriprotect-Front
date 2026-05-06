import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { StatutDemande, StatutCredit } from '../credit-workflow.models';

export type StepState = 'pending' | 'active' | 'done' | 'error';

@Component({
  selector: 'app-cw-workflow-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cw-stepper" role="navigation" aria-label="Progression demande crédit">
      <ng-container *ngFor="let s of steps; let i = index">
        <div
          class="cw-step"
          [class.done]="s.state === 'done'"
          [class.active]="s.state === 'active'"
          [class.err]="s.state === 'error'"
        >
          <div class="dot">
            <span *ngIf="s.state !== 'done'">{{ i + 1 }}</span>
            <span *ngIf="s.state === 'done'">✓</span>
          </div>
          <div class="meta">
            <div class="title">{{ s.label }}</div>
            <div class="sub" *ngIf="s.hint">{{ s.hint }}</div>
          </div>
        </div>
        <div class="connector" *ngIf="i < steps.length - 1" [class.done]="s.state === 'done' || s.state === 'error'"></div>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .cw-stepper {
        display: flex;
        align-items: flex-start;
        gap: 0;
        flex-wrap: wrap;
        padding: 16px 18px;
        background: #fff;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      }
      .cw-step {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        min-width: 130px;
        flex: 1 1 110px;
      }
      .dot {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: 700;
        color: #64748b;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        flex-shrink: 0;
      }
      .cw-step.done .dot {
        background: #059669;
        border-color: #059669;
        color: #fff;
      }
      .cw-step.active .dot {
        background: #0f172a;
        border-color: #0f172a;
        color: #fff;
      }
      .cw-step.err .dot {
        background: #dc2626;
        border-color: #dc2626;
        color: #fff;
      }
      .title {
        font-size: 13px;
        font-weight: 600;
        color: #0f172a;
      }
      .sub {
        font-size: 11px;
        color: #64748b;
        margin-top: 2px;
      }
      .connector {
        width: 20px;
        height: 2px;
        background: #e2e8f0;
        margin-top: 13px;
        flex-shrink: 0;
      }
      .connector.done {
        background: #059669;
      }
    `,
  ],
})
export class CwWorkflowStepperComponent {
  @Input() statut: StatutDemande | null = null;
  @Input() hasCredit = false;
  @Input() creditStatut: StatutCredit | null = null;
  @Input() echeancesCount = 0;

  get steps(): { label: string; hint?: string; state: StepState }[] {
    const st = this.statut ?? 'NOUVELLE';

    const instructionDone =
      st === 'EN_COURS_INSTRUCTION' ||
      st === 'ACCEPTEE' ||
      st === 'REJETEE' ||
      st === 'ARCHIVEE' ||
      st === 'ANALYSE_TERMINEE';

    const decisionRejected = st === 'REJETEE';
    const decisionAccepted = st === 'ACCEPTEE' || st === 'ARCHIVEE';

    const sDemande: StepState = st === 'NOUVELLE' ? 'active' : 'done';

    let sInstruction: StepState = 'pending';
    if (st === 'NOUVELLE') sInstruction = 'pending';
    else if (st === 'EN_COURS_INSTRUCTION') sInstruction = 'active';
    else if (instructionDone) sInstruction = 'done';

    let sDecision: StepState = 'pending';
    if (decisionRejected) sDecision = 'error';
    else if (decisionAccepted) sDecision = 'done';
    else if (st === 'EN_COURS_INSTRUCTION') sDecision = 'active';
    else sDecision = 'pending';

    let sCredit: StepState = 'pending';
    if (decisionRejected) sCredit = 'pending';
    else if (this.hasCredit) sCredit = 'done';
    else if (decisionAccepted) sCredit = 'active';
    else sCredit = 'pending';

    let sRemb: StepState = 'pending';
    if (!this.hasCredit) sRemb = 'pending';
    else if (this.creditStatut === 'REMBOURSE') sRemb = 'done';
    else if (this.echeancesCount > 0) sRemb = 'active';
    else sRemb = 'active';

    return [
      { label: 'Demande', hint: 'Nouvelle demande', state: sDemande },
      { label: 'Instruction', hint: 'Étude du dossier', state: sInstruction },
      { label: 'Décision', hint: 'Acceptée / refusée', state: sDecision },
      { label: 'Crédit', hint: 'Octroi & contrat', state: sCredit },
      { label: 'Remboursement', hint: 'Échéances', state: sRemb },
    ];
  }
}

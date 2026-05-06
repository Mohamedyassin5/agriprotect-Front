import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreditApiService } from '../../back-office/credit-workflow/services/credit-api.service';
import { DemandeCreditApiService } from '../../back-office/credit-workflow/services/demande-credit-api.service';
import { calculateMensualite } from '../../back-office/credit-workflow/utils/credit-score.util';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-credit-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="credit-page">
      <div class="credit-header">
        <h1>Credit Center</h1>
        <p>Simulate your monthly payment and submit your credit request as the connected user.</p>
      </div>

      <div class="credit-grid">
        <section class="credit-card">
          <h2>Simulation</h2>
          <form [formGroup]="simulationForm">
            <label>Amount (TND)</label>
            <input type="number" formControlName="montant" />

            <label>Interest rate (%)</label>
            <input type="number" step="0.1" formControlName="tauxInteret" />

            <label>Duration (months)</label>
            <input type="number" formControlName="dureeMois" />

            <label>Fees (TND)</label>
            <input type="number" formControlName="frais" />
          </form>

          <div class="credit-highlight">
            <span>Estimated monthly payment</span>
            <strong>{{ mensualiteLocale | number : '1.2-2' }} TND</strong>
          </div>

          <button type="button" class="btn btn-primary" (click)="runBackendSimulation()" [disabled]="simulationLoading">
            {{ simulationLoading ? 'Simulating...' : 'Run simulation' }}
          </button>

          <div class="result-table" *ngIf="ranking?.rankedOffers?.length">
            <h3>Server result</h3>
            <table>
              <thead>
                <tr>
                  <th>Monthly</th>
                  <th>Total Cost</th>
                  <th>Interests</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let offer of ranking.rankedOffers">
                  <td>{{ offer.mensualite | number : '1.2-2' }}</td>
                  <td>{{ offer.totalCost | number : '1.2-2' }}</td>
                  <td>{{ offer.totalInterets | number : '1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="credit-card">
          <h2>Demande Credit</h2>

          <form [formGroup]="demandeForm" (ngSubmit)="submitDemande()">
            <label>Requested amount (TND)</label>
            <input type="number" formControlName="montantDemande" />

            <label>Request date</label>
            <input type="date" formControlName="dateDemande" />

            <label>Description</label>
            <textarea rows="4" formControlName="description" placeholder="Describe your project and need..."></textarea>

            <button type="submit" class="btn btn-primary" [disabled]="submittingDemande || !connectedUserId">
              {{ submittingDemande ? 'Submitting...' : 'Submit demande credit' }}
            </button>
          </form>

          <p class="success" *ngIf="demandeSuccessMessage">{{ demandeSuccessMessage }}</p>
          <p class="error" *ngIf="demandeErrorMessage">{{ demandeErrorMessage }}</p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .credit-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 10px 0 24px;
      color: #1f2937;
    }
    .credit-header h1 {
      margin: 16px 0 6px;
      color: #1b4332;
      font-size: 28px;
      font-weight: 800;
    }
    .credit-header p {
      margin: 0 0 20px;
      color: #40916c;
    }
    .credit-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
    }
    .credit-card {
      background: #ffffff;
      border: 1px solid #dce9e1;
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
    }
    .credit-card h2 {
      margin: 0 0 12px;
      color: #1b4332;
      font-size: 20px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    label {
      margin-top: 6px;
      font-weight: 600;
      color: #374151;
      font-size: 13px;
    }
    input, textarea {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 14px;
      font-family: inherit;
    }
    .credit-highlight {
      margin: 14px 0;
      padding: 12px;
      border-radius: 10px;
      background: #ecfdf3;
      border: 1px solid #b7efc5;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn {
      border: 0;
      border-radius: 10px;
      padding: 10px 12px;
      cursor: pointer;
      font-weight: 700;
      margin-top: 12px;
    }
    .btn-primary {
      background: linear-gradient(135deg, #2d6a4f, #1b4332);
      color: #fff;
    }
    .btn[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .result-table {
      margin-top: 14px;
    }
    .result-table table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .result-table th, .result-table td {
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
      padding: 8px 4px;
    }
    .muted {
      margin: 4px 0 10px;
      color: #6b7280;
      font-size: 13px;
    }
    .success {
      margin-top: 10px;
      color: #166534;
      font-weight: 600;
    }
    .error {
      margin-top: 10px;
      color: #b91c1c;
      font-weight: 600;
    }
  `]
})
export class CreditPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly creditApi = inject(CreditApiService);
  private readonly demandeApi = inject(DemandeCreditApiService);
  private readonly authService = inject(AuthService);

  simulationForm = this.fb.group({
    montant: [25000, [Validators.required, Validators.min(1)]],
    tauxInteret: [7.5, [Validators.required, Validators.min(0)]],
    dureeMois: [36, [Validators.required, Validators.min(1)]],
    frais: [0, [Validators.min(0)]],
  });

  demandeForm = this.fb.group({
    montantDemande: [25000, [Validators.required, Validators.min(0.01)]],
    dateDemande: [this.todayIso(), [Validators.required]],
    description: [''],
  });

  connectedUserId: string | null = null;
  mensualiteLocale = 0;
  ranking: any = null;
  simulationLoading = false;
  submittingDemande = false;
  demandeSuccessMessage = '';
  demandeErrorMessage = '';

  ngOnInit(): void {
    this.connectedUserId = this.resolveConnectedUserId();
    this.recalcLocal();
    this.simulationForm.valueChanges.subscribe(() => this.recalcLocal());
  }

  recalcLocal(): void {
    const values = this.simulationForm.getRawValue();
    this.mensualiteLocale = calculateMensualite(
      Number(values.montant),
      Number(values.tauxInteret),
      Number(values.dureeMois)
    );
  }

  runBackendSimulation(): void {
    if (this.simulationForm.invalid) {
      this.simulationForm.markAllAsTouched();
      return;
    }
    const values = this.simulationForm.getRawValue();
    this.simulationLoading = true;
    this.creditApi
      .simulate({
        criteria: 'MIN_TOTAL_COST',
        offres: [
          {
            montant: Number(values.montant),
            tauxInteret: Number(values.tauxInteret),
            dureeMois: Number(values.dureeMois),
            frais: Number(values.frais ?? 0),
          },
        ],
      })
      .subscribe({
        next: (response) => {
          this.ranking = response;
          this.simulationLoading = false;
        },
        error: () => {
          this.simulationLoading = false;
        },
      });
  }

  submitDemande(): void {
    this.demandeSuccessMessage = '';
    this.demandeErrorMessage = '';

    if (!this.connectedUserId) {
      this.demandeErrorMessage = 'Connected user ID not found. Please login again.';
      return;
    }

    if (this.demandeForm.invalid) {
      this.demandeForm.markAllAsTouched();
      return;
    }

    const values = this.demandeForm.getRawValue();
    this.submittingDemande = true;

    this.demandeApi
      .creerDemande({
        agriculteurId: this.connectedUserId,
        montantDemande: Number(values.montantDemande),
        dateDemande: String(values.dateDemande),
        description: values.description?.trim() || undefined,
      })
      .subscribe({
        next: (demande) => {
          this.submittingDemande = false;
          this.demandeSuccessMessage = `Demande credit submitted successfully. Reference ID: ${demande.id}`;
        },
        error: () => {
          this.submittingDemande = false;
          this.demandeErrorMessage = 'Unable to submit demande credit. Please verify backend availability.';
        },
      });
  }

  private resolveConnectedUserId(): string | null {
    return this.authService.getUserId() || null;
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

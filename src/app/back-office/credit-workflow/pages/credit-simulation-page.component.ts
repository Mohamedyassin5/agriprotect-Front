import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CreditApiService } from '../services/credit-api.service';
import { CreditToastService } from '../services/credit-toast.service';
import { calculateMensualite } from '../utils/credit-score.util';

@Component({
  selector: 'app-credit-simulation-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './credit-simulation-page.component.html',
  styleUrl: './credit-simulation-page.component.css',
})
export class CreditSimulationPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CreditApiService);
  private readonly toast = inject(CreditToastService);
  private readonly destroyRef = inject(DestroyRef);

  form = this.fb.group({
    montant: [25000, [Validators.required, Validators.min(1)]],
    tauxInteret: [7.5, [Validators.required, Validators.min(0)]],
    dureeMois: [36, [Validators.required, Validators.min(1)]],
    frais: [0, [Validators.min(0)]],
  });

  mensualiteLocale = 0;
  ranking: any = null;
  loading = false;

  ngOnInit(): void {
    this.recalcLocal();
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.recalcLocal());
  }

  recalcLocal(): void {
    const v = this.form.getRawValue();
    this.mensualiteLocale = calculateMensualite(Number(v.montant), Number(v.tauxInteret), Number(v.dureeMois));
  }

  runBackendRanking(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.loading = true;
    this.api
      .simulate({
        criteria: 'MIN_TOTAL_COST',
        offres: [
          {
            montant: Number(v.montant),
            tauxInteret: Number(v.tauxInteret),
            dureeMois: Number(v.dureeMois),
            frais: Number(v.frais ?? 0),
          },
        ],
      })
      .subscribe({
        next: (res) => {
          this.ranking = res;
          this.loading = false;
          this.toast.success('Simulation serveur terminée.');
        },
        error: () => {
          this.loading = false;
          this.toast.error('Simulation indisponible (vérifiez le backend).');
        },
      });
  }
}

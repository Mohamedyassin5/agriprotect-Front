import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DemandeCreditApiService } from '../services/demande-credit-api.service';
import { CreditToastService } from '../services/credit-toast.service';

@Component({
  selector: 'app-demande-create-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './demande-create-wizard.component.html',
  styleUrl: './demande-create-wizard.component.css',
})
export class DemandeCreateWizardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(DemandeCreditApiService);
  private readonly toast = inject(CreditToastService);
  private readonly router = inject(Router);

  step = 1;

  form = this.fb.group({
    agriculteurId: [null as number | null, [Validators.required, Validators.min(1)]],
    montantDemande: [null as number | null, [Validators.required, Validators.min(0.01)]],
    dateDemande: [this.todayIso(), Validators.required],
    description: [''],
  });

  submitting = false;

  next(): void {
    if (this.step === 1 && this.invalidKeys(['agriculteurId', 'montantDemande'])) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.step < 3) this.step += 1;
  }

  back(): void {
    if (this.step > 1) this.step -= 1;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.submitting = true;
    this.api
      .creerDemande({
        agriculteurId: Number(v.agriculteurId),
        montantDemande: Number(v.montantDemande),
        dateDemande: v.dateDemande!,
        description: v.description?.trim() || undefined,
      })
      .subscribe({
        next: (d) => {
          this.toast.success('Demande créée avec succès.');
          this.router.navigate(['/back-office/credit/demandes', d.id]);
        },
        error: () => {
          this.toast.error('Création impossible. Vérifiez les champs et le backend.');
          this.submitting = false;
        },
      });
  }

  private invalidKeys(keys: string[]): boolean {
    return keys.some((k) => {
      const c = this.form.get(k);
      return !c || c.invalid;
    });
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

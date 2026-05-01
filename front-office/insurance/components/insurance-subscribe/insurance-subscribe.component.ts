import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { InsuranceService } from '../../services/insurance.service';
import { CoverageType, PaymentMode } from '../../models/insurance.models';

@Component({
  selector: 'app-insurance-subscribe',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './insurance-subscribe.component.html',
  styleUrls: ['./insurance-subscribe.component.css']
})
export class InsuranceSubscribeComponent implements OnInit {
  selectedCoverage: CoverageType = 'STANDARD';
  selectedPaymentMode: PaymentMode = 'MONTHLY';
  loading = false;
  error: string | null = null;
  success = false;

  coverageOptions: { value: CoverageType; label: string; icon: string; desc: string }[] = [
    { value: 'BASIC',    label: 'Basique',  icon: '🌱', desc: 'Couverture minimale contre les risques principaux' },
    { value: 'STANDARD', label: 'Standard', icon: '🌾', desc: 'Couverture équilibrée pour la majorité des agriculteurs' },
    { value: 'PREMIUM',  label: 'Premium',  icon: '⭐', desc: 'Protection étendue avec franchise réduite' },
  ];

  paymentModeOptions: { value: PaymentMode; label: string; desc: string }[] = [
    { value: 'MONTHLY',   label: 'Mensuel',     desc: 'Paiement chaque mois' },
    { value: 'QUARTERLY', label: 'Trimestriel', desc: 'Paiement tous les 3 mois' },
    { value: 'ANNUAL',    label: 'Annuel',      desc: 'Paiement unique annuel' },
  ];

  constructor(
    private insuranceService: InsuranceService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const formula = this.route.snapshot.queryParamMap.get('formula') as CoverageType;
    if (formula && ['BASIC', 'STANDARD', 'PREMIUM'].includes(formula)) {
      this.selectedCoverage = formula;
    }
  }

  subscribe(): void {
    this.loading = true;
    this.error = null;

    this.insuranceService.subscribe(this.selectedCoverage, this.selectedPaymentMode).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => this.router.navigate(['/front-office/dashboard']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Erreur lors de la souscription. Veuillez réessayer.';
      }
    });
  }
}
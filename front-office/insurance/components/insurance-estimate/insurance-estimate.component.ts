import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InsuranceService } from '../../services/insurance.service';
import { PremiumEstimationResponse, CoverageType } from '../../models/insurance.models';

@Component({
  selector: 'app-insurance-estimate',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './insurance-estimate.component.html',
  styleUrls: ['./insurance-estimate.component.css']
})
export class InsuranceEstimateComponent implements OnInit {
  selectedCoverage: CoverageType = 'STANDARD';

  // Quand l'utilisateur change le niveau de couverture, on met à jour la formule affichée
  selectCoverage(value: CoverageType): void {
    this.selectedCoverage = value;
    if (this.estimation) {
      this.selectedFormula = value;
    }
  }
  useAI = true;
  estimation: PremiumEstimationResponse | null = null;
  loading = false;
  error: string | null = null;

  // Formule actuellement sélectionnée par l'utilisateur dans la comparaison
  selectedFormula: string = '';

  coverageOptions: { value: CoverageType; label: string; desc: string; icon: string }[] = [
    { value: 'BASIC',    label: 'Basique',   desc: 'Protection essentielle', icon: '🌱' },
    { value: 'STANDARD', label: 'Standard',  desc: 'Couverture équilibrée',  icon: '🌾' },
    { value: 'PREMIUM',  label: 'Premium',   desc: 'Protection étendue',     icon: '⭐' },
  ];

  get riskColor(): string {
    const map: Record<string, string> = {
      LOW: '#22c55e', MEDIUM: '#f97316', HIGH: '#ef4444', VERY_HIGH: '#7f1d1d'
    };
    return this.estimation ? (map[this.estimation.riskLevel] || '#6b7280') : '#6b7280';
  }

  get riskScorePercent(): number {
    return this.estimation ? Math.round((this.estimation.aiRiskScore || 0) * 100) : 0;
  }

  get formulaEntries(): { key: string; detail: any }[] {
    if (!this.estimation?.detailsByFormula) return [];
    return Object.entries(this.estimation.detailsByFormula).map(([key, detail]) => ({ key, detail }));
  }

  /** Détails de la formule sélectionnée par l'utilisateur */
  get selectedFormulaDetail(): any {
    if (!this.estimation?.detailsByFormula || !this.selectedFormula) return null;
    return this.estimation.detailsByFormula[this.selectedFormula] || null;
  }

  /** Sélectionner une formule depuis la liste de comparaison */
  selectFormula(key: string): void {
    this.selectedFormula = key;
  }

  ngOnInit(): void {
    this.runEstimate();
  }

  runEstimate(): void {
    this.loading = true;
    this.error = null;
    this.estimation = null;

    const call = this.useAI
      ? this.insuranceService.estimateAIComplete(this.selectedCoverage)
      : this.insuranceService.estimate(this.selectedCoverage);

    call.subscribe({
      next: data => {
        this.estimation = data;
        // On sélectionne la formule correspondant au niveau choisi par l'utilisateur
        this.selectedFormula = this.selectedCoverage;
        this.loading = false;
      },
      error: () => {
        this.error = "Erreur lors du calcul de l'estimation.";
        this.loading = false;
      }
    });
  }

  isSuggested(key: string): boolean {
    return this.estimation?.suggestedFormula === key;
  }

  get recommendationText(): string {
    return this.estimation?.recommendationReason || "Analyse en cours...";
  }

  get insightsText(): string {
    const aiInsights = this.estimation?.aiInsights;
    if (!aiInsights) return '';
    if (aiInsights['insights'] && typeof aiInsights['insights'] === 'string') return aiInsights['insights'];
    if (aiInsights['text'] && typeof aiInsights['text'] === 'string') return aiInsights['text'];
    if (typeof aiInsights === 'string') return aiInsights;
    return 'Analyse IA terminée';
  }

  get minAllowedInsuredAmount(): number {
  const insured = this.selectedFormulaDetail?.insuredAmount;
  return insured ? Math.round(insured * 0.8) : 0;
}

get maxAllowedInsuredAmount(): number {
  const insured = this.selectedFormulaDetail?.insuredAmount;
  return insured ? Math.round(insured * 1.2) : 0;
}
  constructor(private insuranceService: InsuranceService) {}
}
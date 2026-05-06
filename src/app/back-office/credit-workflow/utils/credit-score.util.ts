/**
 * Prévisualisation alignée sur DemandeCreditServiceImpl.scoreDemande (backend).
 */
export interface ScorePreviewInput {
  revenuBrut: number;
  coutTotal: number;
  montantDemande: number;
}

export interface ScorePreviewResult {
  revenueStabilityScore: number;
  debtRatioScore: number;
  projectRiskScore: number;
  historyScore: number;
  finalScore: number;
  recommendation: 'AUTO_ACCEPT' | 'MANUAL_REVIEW' | 'AUTO_REJECT';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function previewCreditScore(input: ScorePreviewInput): ScorePreviewResult {
  const revenu = input.revenuBrut;
  const cout = input.coutTotal;
  const ratioDette = revenu === 0 ? 1.0 : Math.min(1.0, cout / revenu);

  const revenueStability = clamp(40 + revenu / 1000.0, 0, 100);
  const debtRatioScore = clamp((1 - ratioDette) * 100, 0, 100);
  const projectRisk = clamp(100 - input.montantDemande / 500.0, 0, 100);
  const history = 60.0;

  const finalScore = roundMoney(
    revenueStability * 0.3 + debtRatioScore * 0.3 + projectRisk * 0.25 + history * 0.15
  );

  const recommendation: ScorePreviewResult['recommendation'] =
    finalScore >= 75 ? 'AUTO_ACCEPT' : finalScore >= 55 ? 'MANUAL_REVIEW' : 'AUTO_REJECT';

  return {
    revenueStabilityScore: roundMoney(revenueStability),
    debtRatioScore: roundMoney(debtRatioScore),
    projectRiskScore: roundMoney(projectRisk),
    historyScore: history,
    finalScore,
    recommendation,
  };
}

/** Mensualité constante (amortissement type français / annuité) */
export function calculateMensualite(montant: number, tauxAnnuelPct: number, dureeMois: number): number {
  if (dureeMois <= 0 || montant <= 0) return 0;
  const tm = tauxAnnuelPct / 100 / 12;
  if (tm === 0) return roundMoney(montant / dureeMois);
  const factor = Math.pow(1 + tm, dureeMois);
  const m = (montant * tm * factor) / (factor - 1);
  return roundMoney(m);
}

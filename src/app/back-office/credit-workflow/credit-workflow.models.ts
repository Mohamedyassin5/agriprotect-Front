/** Aligné sur les DTO / enums du backend AgriProtect */

export type StatutDemande =
  | 'NOUVELLE'
  | 'EN_COURS_INSTRUCTION'
  | 'ANALYSE_TERMINEE'
  | 'ACCEPTEE'
  | 'REJETEE'
  | 'ANNULEE'
  | 'ARCHIVEE';

export type StatutCredit =
  | 'DEBOURSE'
  | 'EN_COURS'
  | 'EN_RETARD'
  | 'RESTRUCTURE'
  | 'REMBOURSE'
  | 'IMPAYE'
  | 'ANNULE';

export type StatutEcheance =
  | 'A_VENIR'
  | 'ECHUE_NON_PAYEE'
  | 'PAYEE_EN_RETARD'
  | 'PAYEE_A_TEMPS'
  | 'PAYEE_PARTIELLEMENT'
  | 'IMPAYEE_DEFINITIVE'
  | 'REPORT'
  | 'ANNULEE';

export type DecisionCredit =
  | 'ACCEPTEE'
  | 'REFUSEE'
  | 'CONDITIONNELLE'
  | 'EN_ATTENTE'
  | 'NON_EVALUEE';

export interface CreationDemandeCreditDto {
  dateDemande: string;
  agriculteurId: string | number;
  montantDemande: number;
  description?: string;
}

export interface UpdateDemandeCreditDto {
  dateDemande?: string;
  montantDemande?: number;
  description?: string;
}

export interface DemandeCreditResponseDto {
  id: number;
  dateDemande: string;
  statut: StatutDemande;
  agriculteurId: string | number;
  montantDemande: number;
  description?: string;
}

export interface DemandeCreditFilterParams {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: string;
  statut?: StatutDemande;
  dateFrom?: string;
  dateTo?: string;
}

export interface AnalyseRentabiliteCreateDto {
  revenuBrut: number;
  coutTotal: number;
  decision: DecisionCredit;
  commentaire?: string;
}

export interface AnalyseRentabiliteResponseDto {
  id: number;
  revenuBrut: number;
  coutTotal: number;
  beneficeNet: number;
  decision: DecisionCredit;
  commentaire?: string;
  dateAnalyse: string;
  demandeCreditId: number;
  analysteId?: number;
  scoreFinal?: number;
  recommendation?: string;
}

export interface CreditScoringDto {
  revenueStabilityScore?: number;
  debtRatioScore?: number;
  projectRiskScore?: number;
  historyScore?: number;
  finalScore?: number;
  recommendation?: string;
}

export interface CreationCreditDto {
  montant: number;
  tauxInteret: number;
  dureeMois: number;
  dateDebut: string;
  assuranceId?: number;
}

export interface CreditResponseDto {
  id: number;
  montant: number;
  tauxInteret: number;
  dureeMois: number;
  dateDebut: string;
  dateFin: string;
  statut: StatutCredit;
  agriculteurId: number;
  demandeCreditId: number;
  assuranceId?: number;
  referenceContrat?: string;
}

export interface EcheanceResponseDto {
  id: number;
  dateEcheance: string;
  montantDu: number;
  montantPaye: number;
  statut: StatutEcheance;
  capitalDu?: number;
  interetsDu?: number;
  assuranceDu?: number;
  datePaiementEffectif?: string;
  referencePaiement?: string;
  joursRetard?: number;
  penalite?: number;
  numeroEcheance?: number;
  creditId: number;
}

export interface EcheancePaiementDto {
  montantPaye: number;
  datePaiement?: string;
  referencePaiement?: string;
}

export interface DecisionFinaleDto {
  decision: DecisionCredit;
  commentaire?: string;
  actorId?: number;
}

export interface DemandeAnalysisReportDto {
  demandeId: number;
  agriculteurId: number;
  statut: StatutDemande;
  montantDemande?: number;
  revenuBrut?: number;
  coutTotal?: number;
  beneficeNet?: number;
  scoreFinal?: number;
  recommendation?: string;
}

export interface CreditSimulationOfferDto {
  montant: number;
  tauxInteret: number;
  dureeMois: number;
  frais?: number;
}

export interface CreditSimulationRequestDto {
  offres: CreditSimulationOfferDto[];
  criteria?: string;
}

export interface CreditSimulationResultDto {
  montant?: number;
  tauxInteret?: number;
  dureeMois?: number;
  mensualite?: number;
  totalInterets?: number;
  totalCost?: number;
  affordabilityRatio?: number;
  frais?: number;
}

export interface CreditSimulationResponseDto {
  criteria?: string;
  rankedOffers?: CreditSimulationResultDto[];
}

export interface PortfolioKpiDto {
  totalOutstanding?: number;
  par30Ratio?: number;
  defaultRatioProxy?: number;
  collectionRate?: number;
}

export interface PortfolioAlertDto {
  code?: string;
  message?: string;
}

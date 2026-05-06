// ─── Enums ────────────────────────────────────────────────────────────────────
export type StatutRemboursement = 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE' | 'PAYE' | 'ANNULE';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

/** Retourné après soumission ou simulation (POST /remboursements/sinistre/:id) */
export interface RemboursementDTO {
  remboursementId?: string;       // null si simulation
  sinistreId: string;
  insuranceId: string;
  policyNumber: string;

  // Détails du calcul
  montantDommagesDeclares: number;
  montantFranchise: number;
  montantRemboursableAvantRegles: number;
  coefficientProrata: number;
  montantApresProrata: number;
  primesRestantesDues: number;
  penaliteResiliation: number;
  montantFinalRembourse: number;

  // Infos contrat
  moisPayes: number;
  moisRestants: number;
  primeParMois: number;

  // Statut — null si simulation
  statut: StatutRemboursement | null;
  dateRemboursement?: string;

  // Traçabilité
  approuveParAdminId?: string;
  motifRefus?: string;

  avertissement?: string;
  simulation: boolean;  // true = dry-run, false = demande réelle
}

/** Entité complète retournée par les endpoints GET */
export interface Remboursement {
  id: string;
  insuranceId: string;
  sinistreId: string;
  policyNumber?: string;

  montantDommagesDeclares: number;
  montantFranchise: number;
  montantRemboursableAvantRegles: number;
  coefficientProrata: number;
  montantApresProrata: number;
  primesRestantesDues: number;
    moisRestants?: number;        // ← AJOUTÉ
  primeParMois?: number; 
  penaliteResiliation: number;
  montantFinalRembourse: number;
  moisPayes?: number;
 
  statut: StatutRemboursement;
  motifRefus?: string;
  avertissement?: string;
  dateRemboursement?: string;   // null si EN_ATTENTE (pas encore versé)
  approuveParAdminId?: string;  // renseigné quand PAYE
  createdAt: string;
}

/** Stats admin */
export interface RemboursementStats {
  totalRemboursements: number;
  enAttente: number;
  approuves: number;
  refuses: number;
  payes: number;
  annules: number;
  totalMontantPaye: number;
  tauxApprobation: number;
  tauxRefus: number;
  seuilAutoVersement: number;
}
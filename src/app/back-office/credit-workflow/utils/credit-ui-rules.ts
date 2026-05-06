import type { StatutDemande } from '../credit-workflow.models';

export function canEditDemande(statut: StatutDemande): boolean {
  return statut === 'NOUVELLE';
}

export function canDeleteDemande(statut: StatutDemande): boolean {
  return statut === 'NOUVELLE' || statut === 'REJETEE';
}

export function canStartInstruction(statut: StatutDemande): boolean {
  return statut === 'NOUVELLE';
}

export function canAnalyzeOrFinalize(statut: StatutDemande): boolean {
  return statut === 'EN_COURS_INSTRUCTION';
}

export function canCreateAnalyse(statut: StatutDemande, hasAnalyse: boolean): boolean {
  if (hasAnalyse) return false;
  if (statut === 'ACCEPTEE' || statut === 'REJETEE') return false;
  return true;
}

export function canCreateCredit(statut: StatutDemande, hasCredit: boolean): boolean {
  return statut === 'ACCEPTEE' && !hasCredit;
}

export function canArchive(statut: StatutDemande): boolean {
  return statut === 'ACCEPTEE' || statut === 'REJETEE' || statut === 'ANNULEE';
}

export function canCancel(statut: StatutDemande): boolean {
  return statut === 'NOUVELLE' || statut === 'EN_COURS_INSTRUCTION';
}

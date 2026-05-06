import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { SinistreService, Sinistre } from '../../../services/sinistre.service';
import { RemboursementService } from '../../services/remboursement.service';
import { RemboursementDTO } from '../../models/remboursement.models';

@Component({
  selector: 'app-farmer-creer-demande',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './farmer-creer-demande.component.html',
  styleUrls: ['./farmer-creer-demande.component.css']
})
export class FarmerCreerDemandeComponent implements OnInit {

  // ── Données ───────────────────────────────────────────────────────────────
  sinistres: Sinistre[] = [];
  selectedSinistreId: string | null = null;
  selectedSinistre: Sinistre | null = null;

  // ── Simulation ────────────────────────────────────────────────────────────
  simulation: RemboursementDTO | null = null;
  simulating = false;
  simulationError: string | null = null;
  simulationBloquante = false;

  // ── Soumission ────────────────────────────────────────────────────────────
  resultat: RemboursementDTO | null = null;

  // ── UI States ─────────────────────────────────────────────────────────────
  loading = true;
  submitting = false;
  error: string | null = null;
  success = false;

  readonly STATUTS_ELIGIBLES = ['VALIDE', 'RESOLU'];

  // ── Constantes synchronisées avec RemboursementServiceImpl.java ───────────
  // @Value("${remboursement.seuil-auto-versement:500}")
  readonly SEUIL_AUTO_VERSEMENT = 500;
  // MOIS_MINIMUM_ELIGIBILITE = 6 (FIX 3 — relevé de 3 à 6)
  readonly MOIS_MINIMUM_ELIGIBILITE = 6;
  // MOIS_CARENCE_POST_REMBOURSEMENT = 4
  readonly MOIS_CARENCE_POST_REMB = 4;
  // MAX_REMBOURSEMENTS_PAR_AN = 2
  readonly MAX_REMBOURSEMENTS_AN = 2;
  // JOURS_CARENCE = 30
  readonly JOURS_CARENCE = 30;
  // RATIO_ALERTE_TOTAL_PRIMES = 15
  readonly RATIO_ALERTE = 15;
  // RATIO_BLOQUANT_TOTAL_PRIMES = 25
  readonly RATIO_BLOQUANT = 25;

  // ═══════════════════════════════════════════════════════════════════════════
  // MAPPINGS D'ERREURS — synchronisés avec ErreurMetier.java
  // ═══════════════════════════════════════════════════════════════════════════
  private readonly ERREUR_MAPPINGS: Array<{
    keywords: string[];
    icon: string;
    titre: string;
    message: string;
    bloquant?: boolean;
  }> = [
    // PRIMES_EN_RETARD
    {
      keywords: ['primes impayées', 'régularisez vos paiements'],
      icon: '💳',
      titre: 'Primes impayées',
      message: 'Votre contrat présente des primes impayées. Régularisez vos paiements avant de soumettre une demande.',
      bloquant: true
    },
    // CARENCE_NON_ECOULEE
    {
      keywords: ['période de carence', 'jours'],
      icon: '⏳',
      titre: 'Période de carence',
      message: `Ce sinistre est survenu pendant la période de carence (${this.JOURS_CARENCE} premiers jours du contrat).`,
      bloquant: true
    },
    // MOIS_PAYES_INSUFFISANTS — seuil = MOIS_MINIMUM_ELIGIBILITE (6)
    {
      keywords: ['éligibilité insuffisante', 'mois payé'],
      icon: '📅',
      titre: 'Ancienneté insuffisante',
      message: `Vous devez avoir payé au moins ${this.MOIS_MINIMUM_ELIGIBILITE} mensualités avant de soumettre une demande.`,
      bloquant: true
    },
    // SINISTRE_TYPE_NON_COUVERT
    {
      keywords: ['type de sinistre', 'non couvert', 'inondation', 'sécheresse', 'séisme'],
      icon: '🌾',
      titre: 'Sinistre non couvert',
      message: "Ce type de sinistre n'est pas couvert par votre contrat. Types couverts : INONDATION, SÉCHERESSE, SÉISME.",
      bloquant: true
    },
    // SINISTRE_QUOTA_MANQUANT
    {
      keywords: ["n'a pas encore été réalisée", 'expertise terrain', 'quota'],
      icon: '🔍',
      titre: 'Expertise en attente',
      message: "Les dommages de ce sinistre n'ont pas encore été évalués par un expert.",
      bloquant: true
    },
    // SINISTRE_DOUBLON
    {
      keywords: ['déjà été soumise', 'doublon'],
      icon: '🔁',
      titre: 'Demande déjà soumise',
      message: 'Une demande de remboursement a déjà été soumise pour ce sinistre.',
      bloquant: true
    },
    // DOMMAGES_SOUS_FRANCHISE
    {
      keywords: ['inférieurs ou égaux', 'franchise du contrat'],
      icon: '📉',
      titre: 'Dommages sous franchise',
      message: 'Les dommages estimés sont inférieurs ou égaux à la franchise de votre contrat.',
      bloquant: true
    },
    // MONTANT_NET_NUL
    {
      keywords: ['après déduction des primes', 'montant net est nul'],
      icon: '📉',
      titre: 'Montant net insuffisant',
      message: 'Après déduction des primes restantes dues, votre indemnisation nette est nulle. Contactez votre conseiller.',
      bloquant: true
    },
    // MONTANT_ASSURE_BLOQUANT — FIX 4
    {
      keywords: ['remboursement bloqué', 'seuil bloquant', 'contactez votre conseiller pour réviser'],
      icon: '🚫',
      titre: 'Contrat bloqué — montant disproportionné',
      message: `Le montant assuré est disproportionné par rapport aux primes versées (ratio > ${this.RATIO_BLOQUANT}×). Contactez votre conseiller pour réviser votre contrat.`,
      bloquant: true
    },
    // Dossier signalé non bloquant — alerte anti-fraude
    {
      keywords: ['dossier signalé', 'validation admin obligatoire', 'ratio'],
      icon: '⚠️',
      titre: 'Dossier en cours de vérification',
      message: 'Votre dossier a été signalé pour vérification du montant assuré. Votre demande sera examinée par un conseiller.',
      bloquant: false
    },
    // FREQUENCE_MAX_ATTEINTE
    {
      keywords: ['12 derniers mois', 'limite', 'par an'],
      icon: '🚫',
      titre: 'Limite annuelle atteinte',
      message: `Vous avez atteint le nombre maximum de remboursements autorisés sur les 12 derniers mois (limite : ${this.MAX_REMBOURSEMENTS_AN} par an).`,
      bloquant: true
    },
    // CARENCE_POST_REMBOURSEMENT — FIX 5
    {
      keywords: ['mois de carence requis', 'nouveau remboursement impossible', 'dernier versement'],
      icon: '🕐',
      titre: 'Délai de carence post-remboursement',
      message: `Un délai de ${this.MOIS_CARENCE_POST_REMB} mois est requis entre deux remboursements.`,
      bloquant: true
    },
    // SAVINGS_ACCOUNT_INTROUVABLE / SAVINGS_ACCOUNT_INACTIF
    {
      keywords: ["compte épargne", "n'est pas actif", 'aucun compte épargne'],
      icon: '🏦',
      titre: 'Compte épargne requis',
      message: "Vous devez disposer d'un compte épargne actif pour recevoir un remboursement.",
      bloquant: true
    },
    // SINISTRE_HORS_PERIODE
    {
      keywords: ['en dehors de la période', 'validité du contrat'],
      icon: '📆',
      titre: 'Sinistre hors période',
      message: 'Ce sinistre est survenu en dehors de la période de validité de votre contrat.',
      bloquant: true
    },
    // ASSURANCE_INTROUVABLE
    {
      keywords: ["aucun contrat d'assurance actif"],
      icon: '📋',
      titre: 'Aucun contrat actif',
      message: "Aucun contrat d'assurance actif n'a été trouvé pour votre compte.",
      bloquant: true
    }
  ];

  constructor(
    private sinistreService: SinistreService,
    private remboursementService: RemboursementService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSinistres();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHARGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  loadSinistres(): void {
    this.loading = true;
    this.error = null;

    this.sinistreService.getMySinistres().subscribe({
      next: (data) => {
        this.sinistres = data.filter(s => this.STATUTS_ELIGIBLES.includes(s.statut));
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger vos sinistres.';
        this.loading = false;
      }
    });
  }

  onSinistreSelected(): void {
    this.resetStates();
    if (this.selectedSinistreId) {
      this.selectedSinistre = this.sinistres.find(s => s.id === this.selectedSinistreId) ?? null;
      if (this.selectedSinistre) this.lancerSimulation();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIMULATION
  // ═══════════════════════════════════════════════════════════════════════════

  lancerSimulation(): void {
    this.simulating = true;
    this.simulationError = null;
    this.simulationBloquante = false;
    this.simulation = null;

    this.remboursementService.simulerRemboursement(this.selectedSinistreId!).subscribe({
      next: (dto) => {
        this.simulation = dto;
        this.simulating = false;
      },
      error: (err: HttpErrorResponse) => {
        this.simulating = false;
        const msg = this.extractBackendMessage(err) ?? 'Impossible de simuler.';
        this.simulationError = msg;

        const mapping = this.findErreurMapping(msg);
        this.simulationBloquante = mapping?.bloquant ?? false;
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUMISSION
  // ═══════════════════════════════════════════════════════════════════════════

  submitRemboursement(): void {
    if (!this.canSubmit()) return;

    this.submitting = true;
    this.error = null;

    this.remboursementService.soumettreRemboursement(this.selectedSinistreId!).subscribe({
      next: (response) => {
        this.resultat = response;
        this.success = true;
        this.submitting = false;

        setTimeout(() => {
          this.router.navigate(['/front-office/remboursement/mes-remboursements']);
        }, 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        this.error = this.formatSubmitError(err);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTION DES ERREURS
  // ═══════════════════════════════════════════════════════════════════════════

  private formatSubmitError(err: HttpErrorResponse): string {
    const backendMsg = this.extractBackendMessage(err) ?? '';
    const mapping = this.findErreurMapping(backendMsg);

    if (mapping) {
      return `${mapping.icon} ${mapping.titre}\n${mapping.message}\n\nDétail technique : ${backendMsg}`;
    }

    return `❌ ${backendMsg || 'Une erreur inattendue est survenue lors de la soumission.'}`;
  }

  private findErreurMapping(msg: string): typeof this.ERREUR_MAPPINGS[number] | undefined {
    const msgLower = msg.toLowerCase().trim();
    return this.ERREUR_MAPPINGS.find(rule =>
      rule.keywords.some(kw => msgLower.includes(kw.toLowerCase()))
    );
  }

  private extractBackendMessage(err: HttpErrorResponse): string | null {
    if (!err.error) return null;
    if (typeof err.error === 'object') {
      return err.error.message || err.error.error || err.error.detail || null;
    }
    if (typeof err.error === 'string') {
      return err.error.trim();
    }
    return null;
  }

  private resetStates(): void {
    this.simulation = null;
    this.simulationError = null;
    this.simulationBloquante = false;
    this.resultat = null;
    this.error = null;
    this.success = false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTHODES TEMPLATE
  // ═══════════════════════════════════════════════════════════════════════════

  canSubmit(): boolean {
    return !!this.selectedSinistreId
        && !this.submitting
        && !this.success
        && !this.simulationBloquante;
  }

  /**
   * Versement automatique si montantFinalRembourse ≤ SEUIL_AUTO_VERSEMENT (500 TND).
   * Synchronisé avec @Value("${remboursement.seuil-auto-versement:500}") dans le backend.
   */
  isAutoVersement(): boolean {
    if (!this.simulation) return false;
    const montant = Number(this.simulation.montantFinalRembourse);
    return montant > 0 && montant <= this.SEUIL_AUTO_VERSEMENT;
  }

  /**
   * Vrai si des primes restantes ont été déduites (FIX 1).
   * Le backend renseigne primesRestantesDues dans calculerPrimesRestantes().
   */
  hasPrimesDeduites(): boolean {
    if (!this.simulation?.primesRestantesDues) return false;
    return Number(this.simulation.primesRestantesDues) > 0;
  }

  /**
   * Vrai si le plafond contractuel a été appliqué.
   * Logique miroir de buildDTO() : montantRemboursableAvantRegles > montantFinal + primesDeduites.
   */
  hasPlafondApplique(): boolean {
    if (!this.simulation) return false;
    const remboursable = Number(this.simulation.montantRemboursableAvantRegles ?? 0);
    const final_       = Number(this.simulation.montantFinalRembourse ?? 0);
    const primes       = Number(this.simulation.primesRestantesDues ?? 0);
    return remboursable > (final_ + primes);
  }

  /**
   * Vrai si une pénalité de résiliation a été appliquée (FIX 2 — TAUX_PENALITE_RESILIATION).
   */
  hasPenaliteResiliation(): boolean {
    if (!this.simulation?.penaliteResiliation) return false;
    return Number(this.simulation.penaliteResiliation) > 0;
  }

  getStatutResultatLabel(): string {
    if (!this.resultat?.statut) return '';
    const labels: Record<string, string> = {
      PAYE:       '💳 Versé automatiquement sur votre compte épargne',
      EN_ATTENTE: '⏳ En attente de validation par un conseiller (2–5 jours ouvrés)',
      REFUSE:     '❌ Refusé — montant nul après déductions',
      ANNULE:     '🚫 Annulé'
    };
    return labels[this.resultat.statut] ?? this.resultat.statut;
  }

  getStatusLabel(statut: string): string {
    const labels: Record<string, string> = {
      EN_ATTENTE: '⏳ En attente',
      PAYE:       '✅ Payé',
      REFUSE:     '❌ Refusé',
      ANNULE:     '🚫 Annulé',
      VALIDE:     '✅ Validé',
      RESOLU:     '✔️ Résolu'
    };
    return labels[statut] ?? statut;
  }

  getStatusBadgeClass(statut: string): string {
    const classes: Record<string, string> = {
      EN_ATTENTE: 'bg-warning text-dark',
      PAYE:       'bg-success text-white',
      REFUSE:     'bg-danger text-white',
      ANNULE:     'bg-secondary text-white',
      VALIDE:     'bg-success text-white',
      RESOLU:     'bg-info text-white'
    };
    return classes[statut] ?? 'bg-secondary text-white';
  }

  /**
   * Filtre l'avertissement backend :
   * - Les messages [SIMULATION] sont des récapitulatifs techniques, déjà affichés
   *   dans le sim-breakdown → on les masque pour éviter la redondance.
   * - Seuls les vrais avertissements utilisateur sont affichés (anti-fraude alerte,
   *   plafonnement, déductions inhabituelles…).
   */
  getAvertissementUtilisateur(): string | null {
    const msg = this.simulation?.avertissement;
    if (!msg) return null;
    // Masquer les récapitulatifs techniques générés par genererAvertissement()
    if (msg.startsWith('[SIMULATION]') || msg.startsWith('Dommages :')) return null;
    return msg;
  }

  goBack(): void {
    this.router.navigate(['/front-office/remboursement/mes-remboursements']);
  }
}
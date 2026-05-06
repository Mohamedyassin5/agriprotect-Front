import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { InsuranceService } from '../../services/insurance.service';
import { InsuranceResponse } from '../../models/insurance.models';

export type CertLang = 'FR' | 'EN' | 'AR';
type TranslationValue = string | ((...args: any[]) => string);

interface CertificateTranslations {
  [key: string]: TranslationValue;
  title: string; brand: string; tagline: string; issuedOn: string;
  policeInfo: string; policyNumber: string; coverageType: string;
  insuredAmount: string; annualPremium: string; startDate: string; endDate: string;
  // ── NOUVEAU : infos paiement ──
  paymentInfo: string; amountPerPayment: string; numberOfPayments: string;
  remainingPayments: string; paymentsMade: string;
  guarantees: string; coverageRate: string; damages: string;
  franchise: string; cap: string; threshold: string;
  coveredClaims: string; otherExcluded: string; conditions: string;
  clause1Title: string; clause1Body: (f: number, fAmt: number) => string;
  clause2Title: string; clause2Body: (c: number, cap: number) => string;
  clause3Title: string; clause3Body: (pt: number) => string;
  clause4Title: string; clause4Body: (j: number) => string;
  clause6Title: string; clause6Body: (max: number) => string;
  clause7Title: string; clause7Body: (s: number) => string;
  // ── NOUVEAU : clauses remboursement enrichies ──
  clause8Title: string; clause8Body: (mois: number) => string;
  clause9Title: string; clause9Body: string;
  reimbursementSummary: string;
  autoPayLabel: string; adminValidLabel: string;
  deductionLabel: string; remainingPremDeduction: string;
  footerCompany: string; footerAddress: string; footerLegal: string;
  footerSign: string; signatoryTitle: string; signedOn: string;
  certifiedLabel: string; printBtn: string;
  statusActive: string; statusPending: string; statusOverdue: string; statusSuspended: string;
  insuredOf: string; currency: string;
}

@Component({
  selector: 'app-insurance-certificate',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insurance-certificate.component.html',
  styleUrls: ['./insurance-certificate.component.css']
})
export class InsuranceCertificateComponent implements OnInit, OnChanges {

  @Input() policy: InsuranceResponse | null = null;

  lang: CertLang = 'FR';
  loading = true;
  error: string | null = null;
  today = new Date();
  certNumber = '';

  // ════════════════════════════════════════════════
  // CONSTANTES SYNCHRONISÉES AVEC RemboursementServiceImpl.java
  // ════════════════════════════════════════════════
  readonly JOURS_CARENCE             = 30;
  readonly MAX_REMBOURSEMENTS_AN     = 2;
  readonly SEUIL_AUTO_VERSEMENT      = 500;  // FIX : était 200, maintenant 500
  readonly MOIS_CARENCE_POST_REMB    = 4;    // carence post-remboursement

  // ── Taux par couverture ──
  private readonly ratesMap: Record<string, {
    franchiseRate: number; coverageRate: number; plafondRate: number;
  }> = {
    BASIC:         { franchiseRate: 0.30, coverageRate: 0.60, plafondRate: 0.50 },
    STANDARD:      { franchiseRate: 0.20, coverageRate: 0.75, plafondRate: 0.70 },
    PREMIUM:       { franchiseRate: 0.10, coverageRate: 0.90, plafondRate: 0.90 },
    COMPREHENSIVE: { franchiseRate: 0.10, coverageRate: 0.90, plafondRate: 0.90 },
  };

  readonly TYPES_COUVERTS: Record<CertLang, { key: string; icon: string }[]> = {
    FR: [
      { key: 'INONDATION', icon: '🌊' },
      { key: 'SÉCHERESSE', icon: '☀️' },
      { key: 'SÉISME',     icon: '🪨' },
    ],
    EN: [
      { key: 'FLOOD',   icon: '🌊' },
      { key: 'DROUGHT', icon: '☀️' },
      { key: 'SEISMIC', icon: '🪨' },
    ],
    AR: [
      { key: 'فيضان', icon: '🌊' },
      { key: 'جفاف',  icon: '☀️' },
      { key: 'زلزال', icon: '🪨' },
    ],
  };

  // ════════════════════════════════════════════════
  // TRADUCTIONS (FR / EN / AR)
  // ════════════════════════════════════════════════
  readonly i18n: Record<CertLang, CertificateTranslations> = {
    FR: {
      title: 'CERTIFICAT D\'ASSURANCE',
      brand: 'AgriProtect', tagline: 'Assurance Agricole Tunisie',
      issuedOn: 'Émis le',
      policeInfo: 'Informations de la Police',
      policyNumber: 'Numéro de police', coverageType: 'Type de couverture',
      insuredAmount: 'Montant assuré', annualPremium: 'Prime annuelle',
      startDate: 'Date de début', endDate: 'Date d\'expiration',
      // ── Paiement ──
      paymentInfo: 'Détails des Paiements',
      amountPerPayment: 'Prime par échéance',
      numberOfPayments: 'Nombre total d\'échéances',
      remainingPayments: 'Échéances restantes',
      paymentsMade: 'Échéances honorées',
      guarantees: 'Garanties & Seuils Financiers',
      coverageRate: 'Taux de couverture', damages: 'des dommages constatés',
      franchise: 'Franchise', cap: 'Plafond d\'indemnisation',
      threshold: 'Seuil déclaration minimale',
      coveredClaims: 'Sinistres Couverts',
      otherExcluded: '⚠️ Tout autre type de sinistre (grêle, incendie, vent…) est exclu de cette police.',
      conditions: 'Conditions de Remboursement',
      clause1Title: 'Franchise — Seuil minimum de sinistre',
      clause1Body: (f, fAmt) =>
        `Aucune indemnisation si les dommages sont inférieurs à ${f}% du montant assuré (${fAmt.toFixed(2)} TND). La franchise reste à la charge de l'assuré.`,
      clause2Title: 'Taux et plafond de remboursement',
      clause2Body: (c, cap) =>
        `Indemnisation à hauteur de ${c}% des dommages (après franchise), dans la limite de ${cap.toFixed(2)} TND.`,
      clause3Title: 'Délai de déclaration et pièces justificatives',
      clause3Body: (pt) =>
        `Déclaration dans les 72h. Documents requis : photos, rapport expert, justificatif de surface. Seuil minimum : ${pt.toFixed(2)} TND.`,
      clause4Title: 'Période de carence (Anti-fraude)',
      clause4Body: (j) =>
        `Tout sinistre survenu dans les ${j} premiers jours du contrat est exclu de toute indemnisation.`,
      clause6Title: 'Limite annuelle de remboursements',
      clause6Body: (max) =>
        `Maximum ${max} remboursements acceptés par période de 12 mois glissants.`,
      clause7Title: 'Versement automatique (Micro-remboursement)',
      clause7Body: (s) =>
        `Les indemnisations ≤ ${s} TND sont versées automatiquement sur le compte épargne AgriProtect, sans validation administrative.`,
      // ── NOUVEAUX ──
      clause8Title: 'Carence post-remboursement',
      clause8Body: (mois) =>
        `Après tout versement d'indemnisation, un délai de carence de ${mois} mois est appliqué avant qu'une nouvelle demande soit acceptée.`,
      clause9Title: 'Période de validité du contrat',
      clause9Body: 'Le sinistre doit obligatoirement survenir entre la date de début et la date d\'expiration du contrat. Tout sinistre hors de cette période est exclu de toute indemnisation, quelle que soit sa nature.',
      reimbursementSummary: 'Résumé du Processus de Remboursement',
      autoPayLabel: 'Versement automatique',
      adminValidLabel: 'Validation admin requise',
      deductionLabel: 'Déductions appliquées',
      remainingPremDeduction: 'Les primes restantes dues sont déduites du montant final remboursé.',
      footerCompany: 'AgriProtect S.A. — Assurances Agricoles',
      footerAddress: 'Immeuble AgriTech, Avenue Habib Bourguiba, Tunis 1000',
      footerLegal: 'Document généré automatiquement. Valide uniquement avec le cachet officiel ou la signature numérique.',
      footerSign: 'Direction Technique AgriProtect',
      signatoryTitle: 'Direction Technique', signedOn: 'Signé le',
      certifiedLabel: 'CERTIFIÉ', printBtn: 'Télécharger / Imprimer',
      statusActive: 'Police ACTIVE', statusPending: 'EN ATTENTE DE SIGNATURE',
      statusOverdue: 'EN RETARD', statusSuspended: 'SUSPENDUE',
      insuredOf: 'du montant assuré', currency: 'TND',
    },
    EN: {
      title: 'INSURANCE CERTIFICATE',
      brand: 'AgriProtect', tagline: 'Agricultural Insurance Tunisia',
      issuedOn: 'Issued on',
      policeInfo: 'Policy Information',
      policyNumber: 'Policy Number', coverageType: 'Coverage Type',
      insuredAmount: 'Insured Amount', annualPremium: 'Annual Premium',
      startDate: 'Start Date', endDate: 'Expiry Date',
      paymentInfo: 'Payment Details',
      amountPerPayment: 'Premium per instalment',
      numberOfPayments: 'Total instalments',
      remainingPayments: 'Remaining instalments',
      paymentsMade: 'Paid instalments',
      guarantees: 'Guarantees & Financial Thresholds',
      coverageRate: 'Coverage Rate', damages: 'of documented damages',
      franchise: 'Deductible', cap: 'Indemnity Cap',
      threshold: 'Minimum Declaration Threshold',
      coveredClaims: 'Covered Claims',
      otherExcluded: '⚠️ All other claim types (hail, fire, wind…) are excluded from this policy.',
      conditions: 'Reimbursement Conditions',
      clause1Title: 'Deductible — Minimum Claim Threshold',
      clause1Body: (f, fAmt) =>
        `No compensation if damages are below ${f}% of the insured amount (${fAmt.toFixed(2)} TND). The deductible is fully borne by the policyholder.`,
      clause2Title: 'Reimbursement Rate & Cap',
      clause2Body: (c, cap) =>
        `Compensation at ${c}% of documented damages (after deductible), up to a cap of ${cap.toFixed(2)} TND.`,
      clause3Title: 'Declaration Deadline & Required Documents',
      clause3Body: (pt) =>
        `Claim must be declared within 72 hours. Required: damage photos, expert report, land area proof. Minimum threshold: ${pt.toFixed(2)} TND.`,
      clause4Title: 'Waiting Period (Anti-fraud)',
      clause4Body: (j) =>
        `Any claim within the first ${j} days from the policy start date is excluded from compensation.`,
      clause6Title: 'Annual Reimbursement Limit',
      clause6Body: (max) =>
        `Maximum ${max} reimbursements accepted per rolling 12-month period.`,
      clause7Title: 'Automatic Payment (Micro-reimbursement)',
      clause7Body: (s) =>
        `Compensations ≤ ${s} TND are automatically credited to the insured's AgriProtect savings account, without administrative review.`,
      clause8Title: 'Post-reimbursement Waiting Period',
      clause8Body: (mois) =>
        `After any indemnity payment, a ${mois}-month waiting period applies before a new claim may be submitted.`,
      clause9Title: 'Policy Validity Period',
      clause9Body: 'The claim must occur between the policy start date and expiry date. Any claim outside this period is excluded from compensation, regardless of its nature.',
      reimbursementSummary: 'Reimbursement Process Summary',
      autoPayLabel: 'Automatic payment',
      adminValidLabel: 'Admin validation required',
      deductionLabel: 'Applied deductions',
      remainingPremDeduction: 'Outstanding premiums are deducted from the final reimbursement amount.',
      footerCompany: 'AgriProtect S.A. — Agricultural Insurance',
      footerAddress: 'AgriTech Building, Habib Bourguiba Avenue, Tunis 1000',
      footerLegal: 'Auto-generated document. Valid only with official company seal or digital signature.',
      footerSign: 'AgriProtect Technical Management',
      signatoryTitle: 'Technical Director', signedOn: 'Signed on',
      certifiedLabel: 'CERTIFIED', printBtn: 'Download / Print',
      statusActive: 'Policy ACTIVE', statusPending: 'PENDING SIGNATURE',
      statusOverdue: 'OVERDUE', statusSuspended: 'SUSPENDED',
      insuredOf: 'of insured amount', currency: 'TND',
    },
    AR: {
      title: 'شهادة تأمين',
      brand: 'AgriProtect', tagline: 'التأمين الفلاحي - تونس',
      issuedOn: 'صادرة بتاريخ',
      policeInfo: 'معلومات الوثيقة',
      policyNumber: 'رقم الوثيقة', coverageType: 'نوع التغطية',
      insuredAmount: 'المبلغ المؤمن عليه', annualPremium: 'القسط السنوي',
      startDate: 'تاريخ البدء', endDate: 'تاريخ الانتهاء',
      paymentInfo: 'تفاصيل الأقساط',
      amountPerPayment: 'القسط لكل دفعة',
      numberOfPayments: 'إجمالي الدفعات',
      remainingPayments: 'الدفعات المتبقية',
      paymentsMade: 'الدفعات المسددة',
      guarantees: 'الضمانات والحدود المالية',
      coverageRate: 'نسبة التغطية', damages: 'من الأضرار الموثقة',
      franchise: 'الفرنشيز', cap: 'سقف التعويض',
      threshold: 'الحد الأدنى للتصريح',
      coveredClaims: 'الحوادث المشمولة بالتأمين',
      otherExcluded: '⚠️ كل أنواع الحوادث الأخرى (برد، حريق، رياح…) مستثناة من هذه الوثيقة.',
      conditions: 'شروط التعويض',
      clause1Title: 'الشرط الأول: الفرنشيز',
      clause1Body: (f, fAmt) =>
        `لا يُمنح تعويض إذا كانت الأضرار أقل من ${f}% من المبلغ المؤمن عليه (${fAmt.toFixed(2)} د.ت). يتحمل المؤمن له الفرنشيز كليًا.`,
      clause2Title: 'الشرط الثاني: نسبة وسقف التعويض',
      clause2Body: (c, cap) =>
        `يُعوَّض المؤمن له بنسبة ${c}% من الأضرار المثبتة (بعد الفرنشيز)، بحد أقصى ${cap.toFixed(2)} د.ت.`,
      clause3Title: 'الشرط الثالث: آجال التصريح والوثائق المطلوبة',
      clause3Body: (pt) =>
        `يجب التصريح بالأضرار خلال 72 ساعة. الوثائق المطلوبة: صور، تقرير خبير، إثبات المساحة. الحد الأدنى: ${pt.toFixed(2)} د.ت.`,
      clause4Title: 'الشرط الرابع: فترة الانتظار (مكافحة الغش)',
      clause4Body: (j) =>
        `أي حادث خلال الـ ${j} يوماً الأولى من تاريخ سريان الوثيقة يُستثنى من التعويض.`,
      clause6Title: 'الشرط الخامس: الحد الأقصى السنوي للتعويضات',
      clause6Body: (max) =>
        `الحد الأقصى لعدد التعويضات المقبولة ${max} خلال 12 شهراً متتاليين.`,
      clause7Title: 'الشرط السابع: الدفع التلقائي',
      clause7Body: (s) =>
        `التعويضات التي تساوي أو تقل عن ${s} د.ت تُدفع تلقائياً في حساب AgriProtect دون مراجعة إدارية.`,
      clause8Title: 'الشرط الثامن: فترة الانتظار بعد التعويض',
      clause8Body: (mois) =>
        `بعد كل دفع تعويض، تُطبَّق فترة انتظار مدتها ${mois} أشهر قبل قبول طلب جديد.`,
      clause9Title: 'الشرط التاسع: فترة سريان الوثيقة',
      clause9Body: 'يجب أن يقع الحادث حتماً بين تاريخ بداية الوثيقة وتاريخ انتهائها. كل حادث خارج هذه الفترة مستثنى من التعويض مهما كانت طبيعته.',
      reimbursementSummary: 'ملخص عملية التعويض',
      autoPayLabel: 'دفع تلقائي',
      adminValidLabel: 'يستلزم موافقة إدارية',
      deductionLabel: 'الخصومات المطبقة',
      remainingPremDeduction: 'تُخصم الأقساط المتبقية من المبلغ النهائي للتعويض.',
      footerCompany: 'AgriProtect ش.م.م — تأمينات فلاحية',
      footerAddress: 'مبنى AgriTech، شارع الحبيب بورقيبة، تونس 1000',
      footerLegal: 'وثيقة صادرة آلياً. صالحة فقط بالختم الرسمي أو التوقيع الرقمي للشركة.',
      footerSign: 'الإدارة التقنية - AgriProtect',
      signatoryTitle: 'المدير التقني', signedOn: 'تاريخ التوقيع',
      certifiedLabel: 'مُعتمد', printBtn: 'تحميل / طباعة',
      statusActive: 'الوثيقة فعّالة', statusPending: 'في انتظار التوقيع',
      statusOverdue: 'متأخرة', statusSuspended: 'موقوفة',
      insuredOf: 'من المبلغ المؤمن عليه', currency: 'د.ت',
    },
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: InsuranceService
  ) {}

  ngOnInit(): void {
    if (this.policy) { this.setupFromPolicy(this.policy); return; }
    this.loadFromRoute();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['policy'] && this.policy) this.setupFromPolicy(this.policy);
  }

  private setupFromPolicy(policy: InsuranceResponse): void {
    this.error = null;
    this.loading = false;
    const policyNumber = policy.policyNumber ?? 'UNKNOWN';
    this.certNumber = `CERT-${policyNumber}-${Date.now().toString(36).toUpperCase()}`;
  }

  private loadFromRoute(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const lang = (this.route.snapshot.paramMap.get('lang') ?? 'FR').toUpperCase() as CertLang;
    this.lang = ['FR', 'EN', 'AR'].includes(lang) ? lang : 'FR';
    if (!id) {
      this.error = this.lang === 'AR' ? 'معرّف الوثيقة غير موجود.'
        : this.lang === 'EN' ? 'Policy id missing.' : 'Identifiant de police manquant.';
      this.loading = false; return;
    }
    this.loading = true;
    this.svc.getInsuranceById(id).subscribe({
      next: data => { this.policy = data; this.setupFromPolicy(data); },
      error: () => {
        this.error = this.lang === 'AR' ? 'الوثيقة غير موجودة.'
          : this.lang === 'EN' ? 'Policy not found.' : 'Police introuvable.';
        this.loading = false;
      }
    });
  }

  get isRtl(): boolean { return this.lang === 'AR'; }
  get t(): CertificateTranslations { return this.i18n[this.lang]; }

  callClause(key: string, ...args: any[]): string {
    const value = this.t[key];
    return typeof value === 'function' ? value(...args) : (typeof value === 'string' ? value : '');
  }

  get rates() {
    const key = (this.policy?.coverageType as string)?.toUpperCase() ?? 'STANDARD';
    return this.ratesMap[key] ?? this.ratesMap['STANDARD'];
  }

  get insuredAmount(): number { return Number(this.policy?.insuredAmount ?? 0); }
  get franchiseAmount(): number { return +(this.insuredAmount * this.rates.franchiseRate).toFixed(2); }
  get maxReimbursement(): number { return +(this.insuredAmount * this.rates.plafondRate).toFixed(2); }
  get partialThreshold(): number { return +(this.insuredAmount * 0.30).toFixed(2); }

  // ── Paiements ──
  get paymentsMade(): number {
    const total = this.policy?.numberOfPayments ?? 12;
    const rem   = this.policy?.remainingPayments ?? 0;
    return Math.max(0, total - rem);
  }

  get coverageLabel(): string {
    const mapFR: Record<string, string> = { BASIC: 'Basique', STANDARD: 'Standard', PREMIUM: 'Premium', COMPREHENSIVE: 'Complète' };
    const mapEN: Record<string, string> = { BASIC: 'Basic', STANDARD: 'Standard', PREMIUM: 'Premium', COMPREHENSIVE: 'Comprehensive' };
    const mapAR: Record<string, string> = { BASIC: 'أساسية', STANDARD: 'قياسية', PREMIUM: 'مميزة', COMPREHENSIVE: 'شاملة' };
    const key = (this.policy?.coverageType as string)?.toUpperCase() ?? '';
    const map = this.lang === 'EN' ? mapEN : this.lang === 'AR' ? mapAR : mapFR;
    return map[key] ?? this.policy?.coverageType ?? '—';
  }

  get coveredTypes() { return this.TYPES_COUVERTS[this.lang]; }

  get statusLabel(): string {
    const s = this.policy?.status;
    if (s === 'ACTIVE')            return this.t.statusActive;
    if (s === 'PENDING_SIGNATURE') return this.t.statusPending;
    if (s === 'OVERDUE')           return this.t.statusOverdue;
    if (s === 'SUSPENDED')         return this.t.statusSuspended;
    return s ?? '';
  }

  switchLang(l: CertLang): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.router.navigate(['/front-office/certificate', id, l]); return; }
    this.lang = l;
  }

  print(): void {
    const certDoc = document.querySelector('.cert-document') as HTMLElement | null;
    if (!certDoc) { window.print(); return; }
    const allStyles = Array.from(document.styleSheets).map(sheet => {
      try { return Array.from(sheet.cssRules).map(r => r.cssText).join('\n'); }
      catch { return ''; }
    }).join('\n');
    const clone = certDoc.cloneNode(true) as HTMLElement;
    const propsToInline = [
      'background-color','color','border-color','border-left-color','border-right-color',
      'font-weight','font-size','font-family','display','flex-direction','align-items',
      'justify-content','gap','padding','margin','border-radius','border-width',
      'border-style','text-transform','letter-spacing','line-height','text-align',
      'grid-template-columns','flex-wrap',
    ];
    const originalEls = Array.from(certDoc.querySelectorAll('*')) as HTMLElement[];
    const cloneEls    = Array.from(clone.querySelectorAll('*')) as HTMLElement[];
    originalEls.forEach((origEl, i) => {
      const cloneEl = cloneEls[i]; if (!cloneEl) return;
      const computed = window.getComputedStyle(origEl);
      const inlineStyle = propsToInline.map(p => `${p}:${computed.getPropertyValue(p)}`).join(';');
      cloneEl.setAttribute('style', (cloneEl.getAttribute('style') ?? '') + ';' + inlineStyle);
    });
    const printWindow = window.open('', '_blank', 'width=960,height=800');
    if (!printWindow) { window.print(); return; }
    printWindow.document.write(`<!DOCTYPE html>
<html lang="${this.lang === 'AR' ? 'ar' : this.lang === 'EN' ? 'en' : 'fr'}" ${this.isRtl ? 'dir="rtl"' : ''}>
<head><meta charset="utf-8"><title></title>
<style>
${allStyles}
@page { margin:1.2cm; size:A4; }
* { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }
html,body { margin:0;padding:0;background:#fff;font-family:'Segoe UI',system-ui,sans-serif; }
.cert-header { background:linear-gradient(135deg,#14532d 0%,#166534 60%,#15803d 100%)!important; color:#fff!important; }
.card-green  { background:#f0fdf4!important; border-color:#bbf7d0!important; }
.card-orange { background:#fff7ed!important; border-color:#fed7aa!important; }
.card-blue   { background:#eff6ff!important; border-color:#bfdbfe!important; }
.card-purple { background:#f5f3ff!important; border-color:#ddd6fe!important; }
.clause-card { background:#f0fdf4!important; border-left:4px solid #16a34a!important; }
.clause-card--alert { background:#fff7ed!important; border-left:4px solid #f97316!important; }
.clause-number { background:#16a34a!important; color:#fff!important; }
.clause-number.alert { background:#f97316!important; color:#fff!important; }
.clause-title { color:#111827!important; }
.banner-active    { background:#dcfce7!important; color:#15803d!important; }
.banner-pending   { background:#fef9c3!important; color:#854d0e!important; }
.banner-overdue   { background:#ffedd5!important; color:#c2410c!important; }
.banner-suspended { background:#fee2e2!important; color:#b91c1c!important; }
.type-badge { background:#f0fdf4!important; border-color:#bbf7d0!important; color:#15803d!important; }
.covered-note { background:#fffbeb!important; border-color:#fde68a!important; color:#92400e!important; }
.section-heading { color:#14532d!important; }
.payment-item { background:#f0fdf4!important; border-color:#bbf7d0!important; }
.flow-step { background:#f9fafb!important; border-color:#e5e7eb!important; }
.seal-ring,.seal-inner,.status-dot { animation:none!important; }
.no-print { display:none!important; }
.cert-document { max-width:100%!important; box-shadow:none!important; border-radius:0!important; }
.cert-page { background:#fff!important; padding:0!important; }
</style></head>
<body>${clone.outerHTML}
<script>window.onload=function(){setTimeout(function(){window.print();window.close();},600);};</script>
</body></html>`);
    printWindow.document.close();
  }
}

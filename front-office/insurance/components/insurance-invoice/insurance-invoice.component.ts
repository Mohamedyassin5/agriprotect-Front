import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { InsuranceService } from '../../services/insurance.service';
import { InvoiceData, InsuranceResponse } from '../../models/insurance.models';

type Lang = 'FR' | 'EN' | 'AR';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  FR: {
    brand: 'AgriProtect',
    tagline: 'Assurance Agricole',
    invoiceTitle: 'FACTURE / QUITTANCE',
    issuedOn: 'Émise le',
    policyHolder: 'ASSURÉ',
    policyDetails: 'DÉTAILS DE LA POLICE',
    financialSummary: 'SUIVI FINANCIER',
    currentPayment: 'PAIEMENT EN COURS',
    paymentHistory: 'HISTORIQUE DES PAIEMENTS',
    legalNote: 'CONDITIONS DE PAIEMENT',
    // Assuré
    name: 'Nom',
    email: 'Email',
    phone: 'Téléphone',
    address: 'Adresse',
    // Police
    policyNumber: 'N° Police',
    coverageType: 'Type de couverture',
    insuredAmount: 'Montant assuré',
    annualPremium: 'Prime annuelle',
    period: 'Période de couverture',
    paymentMode: 'Mode de paiement',
    // Financier
    totalPaid: 'Total payé',
    remainingBalance: 'Reste à payer',
    paymentsCompleted: 'Échéances réglées',
    remainingPayments: 'Échéances restantes',
    nextDue: 'Prochaine échéance',
    progressLabel: 'Progression du contrat',
    // Paiement courant
    basePremium: 'Prime de base',
    penalty: 'Pénalité de retard',
    total: 'TOTAL',
    reference: 'Référence Stripe',
    paymentDate: 'Date du paiement',
    paymentStatus: 'Statut',
    // Historique
    date: 'Date',
    amount: 'Montant',
    penaltyCol: 'Pénalité',
    statusCol: 'Statut',
    modeCol: 'Mode',
    // Statuts
    SUCCEEDED: 'Réussi',
    FAILED: 'Échoué',
    REFUNDED: 'Remboursé',
    MONTHLY: 'Mensuel',
    QUARTERLY: 'Trimestriel',
    SEMI_ANNUAL: 'Semestriel',
    ANNUAL: 'Annuel',
    // Footer
    currency: 'TND',
    footerCompany: 'AgriProtect Tunisie S.A.',
    footerAddress: 'Avenue Habib Bourguiba, 1000 Tunis, Tunisie',
    footerPhone: '+216 71 000 000',
    footerLegal: 'Ce document constitue une quittance officielle. Conservez-le pour vos dossiers.',
    certifiedLabel: 'CERTIFIÉ',
    printBtn: 'Imprimer la facture',
    noPayment: 'Aucun paiement enregistré',
    toPay: 'À PAYER',
    paid: 'PAYÉ',
    na: '—',
  },
  EN: {
    brand: 'AgriProtect',
    tagline: 'Agricultural Insurance',
    invoiceTitle: 'INVOICE / RECEIPT',
    issuedOn: 'Issued on',
    policyHolder: 'POLICYHOLDER',
    policyDetails: 'POLICY DETAILS',
    financialSummary: 'FINANCIAL SUMMARY',
    currentPayment: 'CURRENT PAYMENT',
    paymentHistory: 'PAYMENT HISTORY',
    legalNote: 'PAYMENT TERMS',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    policyNumber: 'Policy No.',
    coverageType: 'Coverage Type',
    insuredAmount: 'Insured Amount',
    annualPremium: 'Annual Premium',
    period: 'Coverage Period',
    paymentMode: 'Payment Mode',
    totalPaid: 'Total Paid',
    remainingBalance: 'Remaining Balance',
    paymentsCompleted: 'Completed Installments',
    remainingPayments: 'Remaining Installments',
    nextDue: 'Next Due Date',
    progressLabel: 'Contract Progress',
    basePremium: 'Base Premium',
    penalty: 'Late Penalty',
    total: 'TOTAL',
    reference: 'Stripe Reference',
    paymentDate: 'Payment Date',
    paymentStatus: 'Status',
    date: 'Date',
    amount: 'Amount',
    penaltyCol: 'Penalty',
    statusCol: 'Status',
    modeCol: 'Mode',
    SUCCEEDED: 'Succeeded',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    SEMI_ANNUAL: 'Semi-Annual',
    ANNUAL: 'Annual',
    currency: 'TND',
    footerCompany: 'AgriProtect Tunisia S.A.',
    footerAddress: 'Habib Bourguiba Avenue, 1000 Tunis, Tunisia',
    footerPhone: '+216 71 000 000',
    footerLegal: 'This document is an official receipt. Keep it for your records.',
    certifiedLabel: 'CERTIFIED',
    printBtn: 'Print Invoice',
    noPayment: 'No payment recorded',
    toPay: 'TO PAY',
    paid: 'PAID',
    na: '—',
  },
  AR: {
    brand: 'أغريبروتكت',
    tagline: 'التأمين الزراعي',
    invoiceTitle: 'فاتورة / وصل دفع',
    issuedOn: 'صادرة في',
    policyHolder: 'المؤمَّن عليه',
    policyDetails: 'تفاصيل البوليصة',
    financialSummary: 'الملخص المالي',
    currentPayment: 'الدفع الحالي',
    paymentHistory: 'سجل المدفوعات',
    legalNote: 'شروط الدفع',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    address: 'العنوان',
    policyNumber: 'رقم البوليصة',
    coverageType: 'نوع التغطية',
    insuredAmount: 'المبلغ المؤمَّن عليه',
    annualPremium: 'القسط السنوي',
    period: 'فترة التغطية',
    paymentMode: 'طريقة الدفع',
    totalPaid: 'إجمالي المدفوع',
    remainingBalance: 'الرصيد المتبقي',
    paymentsCompleted: 'الأقساط المسددة',
    remainingPayments: 'الأقساط المتبقية',
    nextDue: 'موعد الدفع القادم',
    progressLabel: 'تقدم العقد',
    basePremium: 'القسط الأساسي',
    penalty: 'غرامة التأخير',
    total: 'الإجمالي',
    reference: 'مرجع Stripe',
    paymentDate: 'تاريخ الدفع',
    paymentStatus: 'الحالة',
    date: 'التاريخ',
    amount: 'المبلغ',
    penaltyCol: 'الغرامة',
    statusCol: 'الحالة',
    modeCol: 'الطريقة',
    SUCCEEDED: 'ناجح',
    FAILED: 'فاشل',
    REFUNDED: 'مُسترد',
    MONTHLY: 'شهري',
    QUARTERLY: 'ربع سنوي',
    SEMI_ANNUAL: 'نصف سنوي',
    ANNUAL: 'سنوي',
    currency: 'دينار',
    footerCompany: 'أغريبروتكت تونس ش.م',
    footerAddress: 'شارع الحبيب بورقيبة، 1000 تونس',
    footerPhone: '+216 71 000 000',
    footerLegal: 'هذه الوثيقة وصل رسمي. احتفظ بها في سجلاتك.',
    certifiedLabel: 'معتمد',
    printBtn: 'طباعة الفاتورة',
    noPayment: 'لا توجد مدفوعات مسجلة',
    toPay: 'للدفع',
    paid: 'مدفوع',
    na: '—',
  }
};

@Component({
  selector: 'app-insurance-invoice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insurance-invoice.component.html',
  styleUrls: ['./insurance-invoice.component.css']
})
export class InsuranceInvoiceComponent implements OnInit, OnChanges {

  /** La police sélectionnée — transmise depuis le dashboard */
  @Input() policy!: InsuranceResponse;

  invoice: InvoiceData | null = null;
  loading = true;
  error: string | null = null;

  lang: Lang = 'FR';
  get t(): Record<string, string> { return TRANSLATIONS[this.lang]; }
  get isRtl(): boolean { return this.lang === 'AR'; }

  today = new Date();

  /** Pourcentage de progression (0-100) */
  get progressPercent(): number {
    if (!this.invoice || this.invoice.totalPayments === 0) return 0;
    return Math.round((this.invoice.paymentsCompleted / this.invoice.totalPayments) * 100);
  }

  /** Couleur de la barre de progression selon le statut */
  get progressColor(): string {
    if (!this.invoice) return '#22c55e';
    const s = this.invoice.status;
    if (s === 'OVERDUE')    return '#f97316';
    if (s === 'SUSPENDED')  return '#ef4444';
    if (s === 'COMPLETED')  return '#3b82f6';
    return '#22c55e';
  }

  constructor(private insuranceService: InsuranceService) {}

  ngOnInit(): void {
    this.loadInvoiceData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['policy'] && !changes['policy'].firstChange) {
      this.loadInvoiceData();
    }
  }

  loadInvoiceData(): void {
    if (!this.policy?.id) return;
    this.loading = true;
    this.error = null;
    this.insuranceService.getInvoiceData(this.policy.id).subscribe({
      next: data => { this.invoice = data; this.loading = false; },
      error: () => { this.error = 'Erreur de chargement de la facture.'; this.loading = false; }
    });
  }

  switchLang(lang: Lang): void { this.lang = lang; }

  print(): void { window.print(); }

  paymentStatusLabel(status: string): string {
    return this.t[status] ?? status;
  }

  paymentModeLabel(mode: string): string {
    return this.t[mode] ?? mode;
  }

  paymentStatusClass(status: string): string {
    const map: Record<string, string> = {
      SUCCEEDED: 'badge-success',
      FAILED:    'badge-error',
      REFUNDED:  'badge-refund'
    };
    return map[status] ?? 'badge-default';
  }

  coverageClass(type: string): string {
    return 'coverage-' + (type ?? '').toLowerCase();
  }
}

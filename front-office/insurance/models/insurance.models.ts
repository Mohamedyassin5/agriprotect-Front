export type CoverageType = 'BASIC' | 'STANDARD' | 'PREMIUM' | 'COMPREHENSIVE';
export type InsuranceStatus = 'PENDING_SIGNATURE' | 'ACTIVE' | 'OVERDUE' | 'SUSPENDED' | 'COMPLETED' | 'CANCELLED';
export type PaymentMode = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type Language = 'FR' | 'EN' | 'AR';
export enum PaymentStatus {
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface InsuranceResponse {
  id: string;
  policyNumber: string;
  coverageType: CoverageType;
  insuredAmount: number;
  premiumAmount: number;
  startDate: string;
  endDate: string;
  status: InsuranceStatus;
  message?: string;
signedByName?: string;
  signedAt?: string;        // ISO date string
  signatureImage?: string;
  // ==================== NOUVEAUX CHAMPS ====================
  paymentMode: string;
  totalPremium: number;
  amountPerPayment: number;
  numberOfPayments: number;
  remainingPayments: number;
  nextPaymentDue?: string;      // LocalDate → string
  penaltyAmount?: number;
  overdue: boolean;     
    suspendedAt?: string;   // ← AJOUTER
  unpaidMonths?: number;        // ← important : c'est "overdue" (pas isOverdue)
}
export interface PaymentResponse {
  paymentIntentId: string;
  clientSecret: string;
  baseAmount: number;
  penaltyAmount: number;
  totalAmount: number;
  currency: string;
  paymentMode: string;
  policyNumber: string;
}

export interface FormulaDetail {
  formulaName: string;
  coveragePercentage: number;
  franchisePercentage: number;
  insuredAmount: number;
  premiumAmount: number;
  shortDescription: string;
}

export interface PremiumEstimationResponse {
  totalPremium: number;
  detailsByFormula: Record<string, FormulaDetail>;
  suggestedFormula: string;
  suggestedInsuredAmount: number;
  minAllowedInsuredAmount: number;
  maxAllowedInsuredAmount: number;
  aiRiskScore: number;
  recommendationReason?: string; 
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  riskFactors: string[];
  aiInsights: Record<string, any>;
}

export interface FarmerDashboard {
  totalPolicies: number;
  activePolicies: number;
  overduePolicies: number;
  suspendedPolicies: number;
  totalPremiumPaid: number;
  nextPaymentDue?: string;
  [key: string]: any;
}

export interface AdminStats {
  totalPolicies: number;
  activePolicies: number;
  overduePolicies: number;
  suspendedPolicies: number;
  completedPolicies: number;
  totalRevenueThisMonth: number;
}
export interface Payment {
  id?: string;                       // UUID généré côté backend
  insuranceId: string;               // ID de l’assurance (relation)
  paymentIntentId?: string;          // ID Stripe
  amount: number;                    // Montant payé (TND) — on mappe BigDecimal -> number
  paymentDate: string;               // ISO string (LocalDateTime -> "2026-04-01T12:00:00")
  status: PaymentStatus;
  paymentMode: string;               // MONTHLY, QUARTERLY, etc.
  penaltyAmount?: number;            // Pénalité appliquée (BigDecimal -> number)
  metadata?: string;                 // Informations supplémentaires (TEXT)
  createdAt?: string;                // Optionnel si vous l’ajoutez côté backend
  updatedAt?: string;                // Optionnel si vous l’ajoutez côté backend
}

// --- DTOs pour l’API ---
export interface CreatePaymentDto {
  insuranceId: string;
  paymentIntentId?: string;
  amount: number;
  paymentDate: string;               // ISO string
  status: PaymentStatus;
  paymentMode: string;
  penaltyAmount?: number;
  metadata?: string;
}

export interface UpdatePaymentDto {
  paymentIntentId?: string;
  amount?: number;
  paymentDate?: string;
  status?: PaymentStatus;
  paymentMode?: string;
  penaltyAmount?: number;
  metadata?: string;
  
}
export interface PaymentSummary {
  date: string;           // ISO LocalDateTime
  amount: number;
  penalty: number;
  status: 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | string;
  mode: string;
  intentId: string;
}
 
export interface InvoiceData {
  // Identifiants
  invoiceNumber: string;
  policyNumber: string;
  insuranceId: string;
 
  // Assuré
  farmerName: string;
  farmerEmail: string;
  farmerPhone: string;
  farmerAddress: string;
 
  // Police
  coverageType: string;
  status: string;
  policyStartDate: string;
  policyEndDate: string;
  insuredAmount: number;
  paymentMode: string;
 
  // Paiement courant
  amountPerPayment: number;
  penaltyAmount: number;
  totalDue: number;
  paymentDate: string | null;
  paymentIntentId: string | null;
  paymentStatus: string | null;
 
  // Suivi financier ← NOUVELLES INFOS
  annualPremium: number;
  totalPaid: number;
  remainingBalance: number;   // ce qu'il reste à payer
  totalPayments: number;
  paymentsCompleted: number;
  remainingPayments: number;
  nextPaymentDue: string | null;
 
  // Historique
  paymentHistory: PaymentSummary[];
 
  // Date facture
  invoiceDate: string;
}
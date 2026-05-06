export type PaymentStatus = 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PENDING';
export type PaymentMode = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

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

export interface Payment {
  id: string;
  insuranceId?: string;
  paymentIntentId: string;
  amount: number;
  paymentDate: string;
  status: PaymentStatus;
  paymentMode: PaymentMode;
  penaltyAmount: number;
  metadata?: string;
  policyNumber?: string;
}

export type StripeApproach = 'embedded' | 'checkout';

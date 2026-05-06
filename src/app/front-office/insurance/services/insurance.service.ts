import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { InvoiceData } from '../models/insurance.models';
import {
  InsuranceResponse,
  PaymentResponse,
  PremiumEstimationResponse,
  FarmerDashboard,
  AdminStats,
  CoverageType,
  PaymentMode,
  InsuranceStatus,
  Language
} from '../models/insurance.models';

@Injectable({ providedIn: 'root' })
export class InsuranceService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/phase1`;

  // ── ESTIMATION ────────────────────────────────────────────────────
  estimate(coverType: CoverageType = 'STANDARD'): Observable<PremiumEstimationResponse> {
    return this.http.get<PremiumEstimationResponse>(`${this.baseUrl}/estimate`, {
      params: { coverType },
    });
  }

  estimateAIComplete(coverType: CoverageType = 'STANDARD'): Observable<PremiumEstimationResponse> {
    return this.http.get<PremiumEstimationResponse>(`${this.baseUrl}/estimate/ai-complete`, {
      params: { coverType },
    });
  }

  // ── SOUSCRIPTION ──────────────────────────────────────────────────
  subscribe(coverType: CoverageType, paymentMode: PaymentMode): Observable<InsuranceResponse> {
    return this.http.post<InsuranceResponse>(`${this.baseUrl}/subscribe`, null, {
      params: { coverType, paymentMode },
    });
  }

  // ── POLICES FARMER ────────────────────────────────────────────────
  getMyInsurances(): Observable<InsuranceResponse[]> {
    return this.http.get<InsuranceResponse[]>(`${this.baseUrl}/my-insurances`);
  }

  /**
   * Retourne TOUTES les polices du farmer (tous statuts : ACTIVE, OVERDUE, SUSPENDED…).
   * Nécessite l'ajout de l'endpoint backend GET /my-insurances-all (voir commentaire).
   */
  getAllMyInsurances(): Observable<InsuranceResponse[]> {
    return this.http.get<InsuranceResponse[]>(`${this.baseUrl}/my-insurances-all`);
  }

  getInsuranceById(id: string): Observable<InsuranceResponse> {
    return this.http.get<InsuranceResponse>(`${this.baseUrl}/${id}`);
  }

  cancelSubscription(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // ── CERTIFICAT & FACTURE ──────────────────────────────────────────
  downloadCertificate(id: string, lang: Language = 'FR'): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/certificate.pdf`, {
      params: { lang },
      responseType: 'blob',
    });
  }

  downloadInvoice(insuranceId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${insuranceId}/invoice.pdf`, {
      responseType: 'blob',
    });
  }

  // ── PAIEMENT ──────────────────────────────────────────────────────
  initiatePayment(insuranceId: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/pay/${insuranceId}`, null);
  }

  getMyPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/my-payments`);
  }

  getPaymentsByInsurance(insuranceId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${insuranceId}/payments`);
  }

  // ── RÉGULARISATION ────────────────────────────────────────────────
  regularize(insuranceId: string): Observable<InsuranceResponse> {
    return this.http.post<InsuranceResponse>(`${this.baseUrl}/${insuranceId}/regularize`, null);
  }

  initiateRegularizationPayment(insuranceId: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/${insuranceId}/regularize-payment`, null);
  }

  // ── DASHBOARD FARMER ──────────────────────────────────────────────
  getFarmerDashboard(): Observable<FarmerDashboard> {
    return this.http.get<FarmerDashboard>(`${this.baseUrl}/dashboard`);
  }

  // ── ADMIN ─────────────────────────────────────────────────────────
  getAllInsurances(status?: InsuranceStatus): Observable<InsuranceResponse[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<InsuranceResponse[]>(`${this.baseUrl}/admin/insurances`, { params });
  }

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.baseUrl}/admin/stats`);
  }

  getOverdueInsurances(): Observable<InsuranceResponse[]> {
    return this.http.get<InsuranceResponse[]>(`${this.baseUrl}/admin/overdue`);
  }
  getInvoiceData(insuranceId: string): Observable<InvoiceData> {
  return this.http.get<InvoiceData>(
    `${this.baseUrl}/${insuranceId}/invoice-data`
  );
}
}
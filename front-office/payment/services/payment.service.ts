import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentResponse, Payment } from '../models/payment.models';

const BASE = 'http://localhost:8081/agri/phase1';

@Injectable({ providedIn: 'root' })
export class PaymentService {

  constructor(private http: HttpClient) {}

  /**
   * Initier un paiement normal (prime mensuelle/trimestrielle/annuelle)
   * POST /agri/phase1/pay/{insuranceId}
   * Retourne: clientSecret + détails du montant
   */
  initiatePayment(insuranceId: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${BASE}/pay/${insuranceId}`, null);
  }

  /**
   * Initier un paiement de régularisation (police OVERDUE/SUSPENDED)
   * POST /agri/phase1/{insuranceId}/regularize-payment
   */
  initiateRegularizationPayment(insuranceId: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${BASE}/${insuranceId}/regularize-payment`, null);
  }

  /**
   * Historique de tous mes paiements
   * GET /agri/phase1/my-payments
   */
  getMyPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${BASE}/my-payments`);
  }

  /**
   * Paiements par police
   * GET /agri/phase1/{insuranceId}/payments
   */
  getPaymentsByInsurance(insuranceId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${BASE}/${insuranceId}/payments`);
  }

  /**
   * Télécharger la facture PDF d'un paiement
   * GET /agri/phase1/{insuranceId}/invoice.pdf
   */
  downloadInvoice(insuranceId: string): Observable<Blob> {
    return this.http.get(`${BASE}/${insuranceId}/invoice.pdf`, { responseType: 'blob' });
  }
}

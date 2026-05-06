import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface SolidarityFund {
  id?: string;
  name: string;
  numeroFond: string;
  cultureType: string;
  minScore: number;
  primeAmount: number;
  currentBalance: number;
}

@Injectable({
  providedIn: 'root'
})
export class SolidarityFundService {
  private apiUrl = 'http://localhost:8081/api/solidarity-funds';

  constructor(private http: HttpClient) {}

  getAllFunds(): Observable<SolidarityFund[]> {
    return this.http.get<SolidarityFund[]>(this.apiUrl);
  }

  getFundById(id: string): Observable<SolidarityFund> {
    return this.http.get<SolidarityFund>(`${this.apiUrl}/${id}`);
  }

  createFund(fund: SolidarityFund): Observable<SolidarityFund> {
    return this.http.post<SolidarityFund>(this.apiUrl, fund);
  }

  updateFund(id: string, fund: SolidarityFund): Observable<SolidarityFund> {
    return this.http.put<SolidarityFund>(`${this.apiUrl}/${id}`, fund);
  }

  deleteFund(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  joinFund(fundId: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/${fundId}/join`, {}, { responseType: 'text' });
  }

  payPrime(fundId: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/${fundId}/pay`, {}, { responseType: 'text' });
  }

  payPrimeForFarmer(fundId: string, farmerId: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/${fundId}/pay/${farmerId}`, {}, { responseType: 'text' });
  }

  getMyMemberships(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-memberships`);
  }

  createPaymentIntent(amount: number, fundId: string, fundName: string): Observable<{ clientSecret: string }> {
    return this.http.post<{ clientSecret: string }>(`http://localhost:8081/api/payments/create-payment-intent`, {
      amount,
      fundId,
      fundName
    });
  }
}

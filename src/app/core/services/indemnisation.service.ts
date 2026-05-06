import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface IndemnisationRequest {
  id: string;
  requestedAmount: number;
  requestReason: string;
  requestDate: string;
  aiScore?: number;
  aiAnalysis?: string;
  status: string;
  decisionReason?: string;
  fund: any;
  farmer: any;
}

export interface PendingRequestDTO {
  id: string;
  farmerName: string;
  fundName: string;
  amount: number;
  reason: string;
  date: string;
  aiScore: number;
  aiAnalysis: string;
}

@Injectable({
  providedIn: 'root'
})
export class IndemnisationService {
  private apiUrl = 'http://localhost:8081/api/indemnisation';

  constructor(private http: HttpClient) {}

  submitRequest(fundId: string, amount: number, sinistreId: string, farmerNotes: string, damageType: string, affectedArea: number | null): Observable<any> {
    const params = new URLSearchParams();
    params.set('fundId', fundId);
    params.set('amount', amount.toString());
    params.set('sinistreId', sinistreId);
    if (farmerNotes) params.set('farmerNotes', farmerNotes);
    if (damageType) params.set('damageType', damageType);
    if (affectedArea !== null && affectedArea !== undefined) params.set('affectedArea', affectedArea.toString());

    return this.http.post(`${this.apiUrl}/request`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  }

  getPendingRequests(): Observable<PendingRequestDTO[]> {
    return this.http.get<PendingRequestDTO[]>(`${this.apiUrl}/pending`);
  }

  getMyHistory(): Observable<IndemnisationRequest[]> {
    return this.http.get<IndemnisationRequest[]>(`${this.apiUrl}/my-history`);
  }

  getMyMemberships(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/memberships`);
  }

  processRequest(requestId: string, approved: boolean, refusalReason?: string): Observable<string> {
    let url = `${this.apiUrl}/${requestId}/process?approved=${approved}`;
    if (refusalReason) {
      url += `&refusalReason=${encodeURIComponent(refusalReason)}`;
    }
    return this.http.put(url, {}, { responseType: 'text' });
  }
}

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

  submitRequest(fundId: string, amount: number, reason: string, image: File): Observable<any> {
    const formData = new FormData();
    formData.append('fundId', fundId);
    formData.append('amount', amount.toString());
    formData.append('reason', reason);
    formData.append('image', image);

    return this.http.post(`${this.apiUrl}/request`, formData);
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

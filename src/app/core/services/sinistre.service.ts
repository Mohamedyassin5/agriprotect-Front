import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SinistreResponse {
  id: string;
  cropId: string;
  cropType: string;
  userId: string;
  userEmail?: string;
  dateCatastrophe: string;
  imageUrl: string;
  typeSinistre: string;
  quotaRemboursement: number;
  description: string;
  statut: string;
  createdAt: string;
  resolvedAt?: string;
  isResolved: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SinistreService {
  private apiUrl = 'http://localhost:8081/agri/sinistres';

  constructor(private http: HttpClient) {}

  declareSinistre(formData: FormData): Observable<SinistreResponse> {
    return this.http.post<SinistreResponse>(`${this.apiUrl}/declare`, formData);
  }

  getMySinistres(): Observable<SinistreResponse[]> {
    return this.http.get<SinistreResponse[]>(`${this.apiUrl}/my`);
  }

  getUnresolvedSinistres(): Observable<SinistreResponse[]> {
    return this.http.get<SinistreResponse[]>(`${this.apiUrl}/unresolved/all`);
  }

  resolveSinistre(id: string): Observable<SinistreResponse> {
    return this.http.put<SinistreResponse>(`${this.apiUrl}/${id}/resolve`, {});
  }
}

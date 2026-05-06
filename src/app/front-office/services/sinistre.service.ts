// src/app/modules/front-office/services/sinistre.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Sinistre {
  id: string;
  cropId: string;
  cropType: string;
  userId: string;
  userEmail: string;
  dateCatastrophe: string;
  imageUrl: string;
  typeSinistre: string;
  quotaRemboursement: number;
  description: string;
  statut: string;
  createdAt: string;
  resolvedAt: string;
  isResolved: boolean;
}

@Injectable({ providedIn: 'root' })
export class SinistreService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/sinistres`; 

  constructor() {
    console.log('🔧 SinistreService initialized with URL:', this.baseUrl);
  }

  /** Déclarer un nouveau sinistre */
  declareSinistre(formData: FormData): Observable<Sinistre> {
    console.log('🔗 POST:', `${this.baseUrl}/declare`);
    return this.http.post<Sinistre>(`${this.baseUrl}/declare`, formData);
  }

  /** Récupérer mes sinistres */
  getMySinistres(): Observable<Sinistre[]> {
    console.log('🔗 GET:', `${this.baseUrl}/my`);
    return this.http.get<Sinistre[]>(`${this.baseUrl}/my`);
  }

  /** Résoudre un sinistre */
  resolveSinistre(id: string): Observable<Sinistre> {
    console.log('🔗 PUT:', `${this.baseUrl}/${id}/resolve`);
    return this.http.put<Sinistre>(`${this.baseUrl}/${id}/resolve`, {});
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Investigation {
  id: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  decisionReason?: string;
  farmer: any;
  expert: any;
  indemnisationRequest: any;
}

export interface FileInvestigationDTO {
  requestId: string;
  type: string;
  description: string;
}

export interface DecideInvestigationDTO {
  accepted: boolean;
  decisionReason: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvestigationService {
  private apiUrl = 'http://localhost:8081/api/investigations';

  constructor(private http: HttpClient) {}

  // Farmer endpoints
  fileInvestigation(dto: FileInvestigationDTO): Observable<Investigation> {
    return this.http.post<Investigation>(`${this.apiUrl}/file`, dto);
  }

  // Expert endpoints
  getAssignedInvestigations(): Observable<Investigation[]> {
    return this.http.get<Investigation[]>(`${this.apiUrl}/expert/my-tasks`);
  }

  decideOnInvestigation(investigationId: string, dto: DecideInvestigationDTO): Observable<Investigation> {
    return this.http.put<Investigation>(`${this.apiUrl}/expert/${investigationId}/decide`, dto);
  }
}

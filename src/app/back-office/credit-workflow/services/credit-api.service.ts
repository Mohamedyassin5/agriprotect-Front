import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  CreditSimulationRequestDto,
  CreditSimulationResponseDto,
  EcheancePaiementDto,
  EcheanceResponseDto,
  PortfolioAlertDto,
  PortfolioKpiDto,
} from '../credit-workflow.models';

@Injectable({ providedIn: 'root' })
export class CreditApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/credits`;

  genererEcheancier(creditId: number): Observable<EcheanceResponseDto[]> {
    return this.http.post<EcheanceResponseDto[]>(`${this.base}/${creditId}/echeancier`, {});
  }

  getEcheances(creditId: number): Observable<EcheanceResponseDto[]> {
    return this.http.get<EcheanceResponseDto[]>(`${this.base}/${creditId}/echeances`);
  }

  enregistrerPaiement(echeanceId: number, dto: EcheancePaiementDto): Observable<EcheanceResponseDto> {
    return this.http.post<EcheanceResponseDto>(`${this.base}/echeances/${echeanceId}/paiement`, dto);
  }

  getUpcoming(creditId: number): Observable<EcheanceResponseDto[]> {
    return this.http.get<EcheanceResponseDto[]>(`${this.base}/${creditId}/echeances/upcoming`);
  }

  getOverdue(creditId: number): Observable<EcheanceResponseDto[]> {
    return this.http.get<EcheanceResponseDto[]>(`${this.base}/${creditId}/echeances/overdue`);
  }

  getPaid(creditId: number): Observable<EcheanceResponseDto[]> {
    return this.http.get<EcheanceResponseDto[]>(`${this.base}/${creditId}/echeances/paid`);
  }

  markOverdueEcheances(): Observable<number> {
    return this.http.post<number>(`${this.base}/echeances/mark-overdue`, {});
  }

  simulate(request: CreditSimulationRequestDto): Observable<CreditSimulationResponseDto> {
    return this.http.post<CreditSimulationResponseDto>(`${this.base}/simulate`, request);
  }

  portfolioKpis(): Observable<PortfolioKpiDto> {
    return this.http.get<PortfolioKpiDto>(`${this.base}/portfolio/kpis`);
  }

  portfolioAlerts(): Observable<PortfolioAlertDto[]> {
    return this.http.get<PortfolioAlertDto[]>(`${this.base}/portfolio/alerts`);
  }
}

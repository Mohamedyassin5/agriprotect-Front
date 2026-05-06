import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  AnalyseRentabiliteCreateDto,
  AnalyseRentabiliteResponseDto,
  CreationCreditDto,
  CreationDemandeCreditDto,
  CreditResponseDto,
  CreditScoringDto,
  DecisionFinaleDto,
  DemandeAnalysisReportDto,
  DemandeCreditFilterParams,
  DemandeCreditResponseDto,
  UpdateDemandeCreditDto,
} from '../credit-workflow.models';

@Injectable({ providedIn: 'root' })
export class DemandeCreditApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/demandes-credit`;

  creerDemande(dto: CreationDemandeCreditDto): Observable<DemandeCreditResponseDto> {
    return this.http.post<DemandeCreditResponseDto>(this.base, dto);
  }

  getDemande(id: number): Observable<DemandeCreditResponseDto> {
    return this.http.get<DemandeCreditResponseDto>(`${this.base}/${id}`);
  }

  getDemandesFiltered(params: DemandeCreditFilterParams): Observable<DemandeCreditResponseDto[]> {
    let hp = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 50))
      .set('sortBy', params.sortBy ?? 'id')
      .set('direction', params.direction ?? 'desc');
    if (params.statut) hp = hp.set('statut', params.statut);
    if (params.dateFrom) hp = hp.set('dateFrom', params.dateFrom);
    if (params.dateTo) hp = hp.set('dateTo', params.dateTo);
    return this.http.get<DemandeCreditResponseDto[]>(this.base, { params: hp });
  }

  updateDemande(id: number, dto: UpdateDemandeCreditDto): Observable<DemandeCreditResponseDto> {
    return this.http.put<DemandeCreditResponseDto>(`${this.base}/${id}`, dto);
  }

  deleteDemande(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  startInstruction(demandeId: number, actorId?: number): Observable<DemandeCreditResponseDto> {
    let hp = new HttpParams();
    if (actorId != null) hp = hp.set('actorId', String(actorId));
    return this.http.post<DemandeCreditResponseDto>(
      `${this.base}/${demandeId}/start-instruction`,
      {},
      { params: hp }
    );
  }

  finaliserDecision(demandeId: number, dto: DecisionFinaleDto): Observable<DemandeCreditResponseDto> {
    return this.http.post<DemandeCreditResponseDto>(`${this.base}/${demandeId}/finalize`, dto);
  }

  archiveDemande(demandeId: number, actorId?: number): Observable<DemandeCreditResponseDto> {
    let hp = new HttpParams();
    if (actorId != null) hp = hp.set('actorId', String(actorId));
    return this.http.post<DemandeCreditResponseDto>(
      `${this.base}/${demandeId}/archive`,
      {},
      { params: hp }
    );
  }

  cancelDemande(demandeId: number, actorId?: number): Observable<DemandeCreditResponseDto> {
    let hp = new HttpParams();
    if (actorId != null) hp = hp.set('actorId', String(actorId));
    return this.http.post<DemandeCreditResponseDto>(
      `${this.base}/${demandeId}/cancel`,
      {},
      { params: hp }
    );
  }

  creerAnalyse(demandeId: number, dto: AnalyseRentabiliteCreateDto): Observable<AnalyseRentabiliteResponseDto> {
    return this.http.post<AnalyseRentabiliteResponseDto>(
      `${this.base}/${demandeId}/analyse-rentabilite`,
      dto
    );
  }

  getAnalyse(demandeId: number): Observable<AnalyseRentabiliteResponseDto> {
    return this.http.get<AnalyseRentabiliteResponseDto>(
      `${this.base}/${demandeId}/analyse-rentabilite`
    );
  }

  updateAnalyse(analyseId: number, dto: AnalyseRentabiliteCreateDto): Observable<AnalyseRentabiliteResponseDto> {
    return this.http.put<AnalyseRentabiliteResponseDto>(
      `${this.base}/analyse-rentabilite/${analyseId}`,
      dto
    );
  }

  creerCreditDepuisDemande(demandeId: number, dto: CreationCreditDto): Observable<CreditResponseDto> {
    return this.http.post<CreditResponseDto>(`${this.base}/${demandeId}/credit`, dto);
  }

  getCreditByDemande(demandeId: number): Observable<CreditResponseDto> {
    return this.http.get<CreditResponseDto>(`${this.base}/${demandeId}/credit`);
  }

  getCredit(creditId: number): Observable<CreditResponseDto> {
    return this.http.get<CreditResponseDto>(`${this.base}/credit/${creditId}`);
  }

  scoreDemande(demandeId: number): Observable<CreditScoringDto> {
    return this.http.get<CreditScoringDto>(`${this.base}/${demandeId}/score`);
  }

  buildReport(demandeId: number): Observable<DemandeAnalysisReportDto> {
    return this.http.get<DemandeAnalysisReportDto>(`${this.base}/${demandeId}/report`);
  }
}

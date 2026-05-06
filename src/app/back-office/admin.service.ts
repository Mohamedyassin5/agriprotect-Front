import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminStats {
  totalPolicies: number;
  activePolicies: number;
  overduePolicies: number;
  suspendedPolicies: number;
  completedPolicies: number;
  totalRevenueThisMonth: number;
}

export interface InsuranceResponse {
  id: string;
  policyNumber: string;
  coverageType: string;
  insuredAmount: number;
  premiumAmount: number;
  startDate: string;
  endDate: string;
  status: string;
  message?: string;
}

export interface CropReference {
  id?: string;
  cropType: string;
  referenceYear: number;
  referenceYield: number;
  referencePrice: number;
  basePremiumRate: number;
  createdAt?: string;
  updatedAt?: string;
}
export type StatutRemboursement =
  | 'EN_ATTENTE'
  | 'APPROUVE'
  | 'VERSE'
  | 'REFUSE'
  | 'ANNULE';
 
export interface RemboursementAdmin {
  id: string;
  statut: StatutRemboursement;
  montantFinalRembourse: number;
  montantDommagesDeclares: number;
  montantFranchise: number;
  montantRemboursableAvantRegles: number;
  coefficientProrata: number;
  montantApresProrata: number;
  primesRestantesDues: number;
  penaliteResiliation: number;
  dateRemboursement: string | null;
  motifRefus: string | null;
  approuveParAdminId: string | null;
  avertissement: string | null;
  stripeRefundId: string | null;
  createdAt: string;
  insurance: {
    id: string;
    policyNumber: string;
    coverageType: string;
    insuredAmount: number;
  };
  sinistre: {
    id: string;
    // Ajoutez les champs de votre entité Sinistre si nécessaire
  };
}
 
export interface RemboursementStats {
  total: number;
  enAttente: number;
  approuves: number;
  verses: number;
  refuses: number;
  annules: number;
  montantTotalVerse: number;
  montantEnAttente: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = '/agri';

  // ── Stats ──────────────────────────────────────────────
  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/phase1/admin/stats`);
  }

  // ── Insurances ─────────────────────────────────────────
  getAllInsurances(status?: string): Observable<InsuranceResponse[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<InsuranceResponse[]>(`${this.base}/phase1/admin/insurances`, { params });
  }

  getOverdueInsurances(): Observable<InsuranceResponse[]> {
    return this.http.get<InsuranceResponse[]>(`${this.base}/phase1/admin/overdue`);
  }

  // ── Crop References ────────────────────────────────────
  getCropReferences(): Observable<CropReference[]> {
    return this.http.get<CropReference[]>(`${this.base}/admin/crop-references`);
  }

  addCropReference(ref: CropReference): Observable<CropReference> {
    return this.http.post<CropReference>(`${this.base}/admin/crop-references`, ref);
  }

  updateCropReference(id: string, ref: CropReference): Observable<CropReference> {
    return this.http.put<CropReference>(`${this.base}/admin/crop-references/${id}`, ref);
  }

  syncFromAgridata(): Observable<string> {
    return this.http.post(`${this.base}/admin/crop-references/sync-agridata`, {}, { responseType: 'text' });
  }
   // ── Remboursements ─────────────────────────────────────────────────────────
 
  getAllRemboursements(statut?: StatutRemboursement, page = 0, size = 20): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (statut) params = params.set('statut', statut);
    return this.http.get<any>(`${this.base}/remboursements/admin/all`, { params });
  }
 
  getRemboursementsByUser(userId: string): Observable<RemboursementAdmin[]> {
    return this.http.get<RemboursementAdmin[]>(`${this.base}/remboursements/admin/user/${userId}`);
  }
 
  getRemboursementById(id: string): Observable<RemboursementAdmin> {
    return this.http.get<RemboursementAdmin>(`${this.base}/remboursements/${id}`);
  }
 
  approuverRemboursement(id: string, montantAjuste?: number): Observable<RemboursementAdmin> {
    let params = new HttpParams();
    if (montantAjuste != null) params = params.set('montantAjuste', montantAjuste);
    return this.http.post<RemboursementAdmin>(`${this.base}/remboursements/${id}/approve`, {}, { params });
  }
 
  refuserRemboursement(id: string, motif: string): Observable<RemboursementAdmin> {
    return this.http.post<RemboursementAdmin>(
      `${this.base}/remboursements/${id}/reject`,
      {},
      { params: new HttpParams().set('motif', motif) }
    );
  }
 
  getRemboursementsSuspects(): Observable<RemboursementAdmin[]> {
    return this.http.get<RemboursementAdmin[]>(`${this.base}/remboursements/admin/suspicious`);
  }
 
  getRemboursementStats(): Observable<RemboursementStats> {
    return this.http.get<RemboursementStats>(`${this.base}/remboursements/admin/stats`);
  }

  // ── Incident Management ────────────────────────────────
  getUnresolvedRisks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/risques/unresolved/all`);
  }

  resolveRisk(id: string): Observable<any> {
    return this.http.put(`${this.base}/risques/${id}/resolve`, {});
  }

  getUnresolvedSinistres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/sinistres/unresolved/all`);
  }

  resolveSinistre(id: string): Observable<any> {
    return this.http.put(`${this.base}/sinistres/${id}/resolve`, {});
  }
}

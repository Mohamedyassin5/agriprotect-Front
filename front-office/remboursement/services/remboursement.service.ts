import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Remboursement,
  RemboursementDTO,
  RemboursementStats,
  StatutRemboursement
} from '../models/remboursement.models';

@Injectable({ providedIn: 'root' })
export class RemboursementService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/remboursements`;

  // ── FARMER ────────────────────────────────────────────────────────────────

  /**
   * Simulation dry-run : calcule le montant estimé SANS soumettre.
   * Aucune persistance, aucun versement.
   * GET /remboursements/simulate/:sinistreId
   */
  simulerRemboursement(sinistreId: string): Observable<RemboursementDTO> {
    return this.http.get<RemboursementDTO>(`${this.baseUrl}/simulate/${sinistreId}`);
  }

  /**
   * Soumet une vraie demande de remboursement.
   * • Montant ≤ 200 TND → PAYE immédiatement (micro-remboursement)
   * • Montant > 200 TND → EN_ATTENTE (validation admin requise)
   * POST /remboursements/sinistre/:sinistreId
   */
  soumettreRemboursement(sinistreId: string): Observable<RemboursementDTO> {
    return this.http.post<RemboursementDTO>(`${this.baseUrl}/sinistre/${sinistreId}`, null);
  }

  /**
   * Annule une demande EN_ATTENTE.
   * DELETE /remboursements/:id/cancel
   */
  annulerRemboursement(remboursementId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${remboursementId}/cancel`);
  }

  /** Récupère tous les remboursements du farmer connecté */
  getMesRemboursements(): Observable<Remboursement[]> {
    return this.http.get<Remboursement[]>(`${this.baseUrl}/my`);
  }

  /** Détail d'un remboursement */
  getRemboursementById(id: string): Observable<Remboursement> {
    return this.http.get<Remboursement>(`${this.baseUrl}/${id}`);
  }

  // ── ADMIN ─────────────────────────────────────────────────────────────────

  /**
   * Liste paginée avec filtre statut optionnel.
   * GET /remboursements/admin/all?statut=EN_ATTENTE&page=0&size=20
   */
  getAllRemboursements(statut?: StatutRemboursement, page = 0, size = 20): Observable<any> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);
    if (statut) params = params.set('statut', statut);
    return this.http.get<any>(`${this.baseUrl}/admin/all`, { params });
  }

  /**
   * Approuver + verser le montant.
   * montantAjuste optionnel : permet à l'admin d'ajuster après expertise terrain.
   * POST /remboursements/:id/approve?montantAjuste=1500
   */
  approuver(id: string, montantAjuste?: number): Observable<Remboursement> {
    let params = new HttpParams();
    if (montantAjuste !== undefined) params = params.set('montantAjuste', montantAjuste);
    return this.http.post<Remboursement>(`${this.baseUrl}/${id}/approve`, null, { params });
  }

  /**
   * Refuser avec motif obligatoire.
   * POST /remboursements/:id/reject?motif=...
   */
  refuser(id: string, motif: string): Observable<Remboursement> {
    const params = new HttpParams().set('motif', motif);
    return this.http.post<Remboursement>(`${this.baseUrl}/${id}/reject`, null, { params });
  }

  /** Remboursements d'un farmer spécifique (admin) */
  getRemboursementsByUser(userId: string): Observable<Remboursement[]> {
    return this.http.get<Remboursement[]>(`${this.baseUrl}/admin/user/${userId}`);
  }

  /** Dossiers suspects — anti-fraude */
  getRemboursementsSuspects(): Observable<Remboursement[]> {
    return this.http.get<Remboursement[]>(`${this.baseUrl}/admin/suspicious`);
  }

  /** Statistiques globales */
  getStats(): Observable<RemboursementStats> {
    return this.http.get<RemboursementStats>(`${this.baseUrl}/admin/stats`);
  }
}
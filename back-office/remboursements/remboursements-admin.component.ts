import { Component, OnInit, OnDestroy, inject, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

export type StatutRemboursement = 'EN_ATTENTE' | 'APPROUVE' | 'VERSE' | 'REFUSE' | 'ANNULE';

export interface RemboursementAdmin {
  id: string;
  statut: StatutRemboursement;
  montantFinalRembourse: number;
  montantDommagesDeclares: number;
  montantFranchise: number;
  coefficientProrata: number;
  primesRestantesDues: number;
  penaliteResiliation: number;
  motifRefus: string | null;
  stripeRefundId: string | null;
  motifAjustement: string | null;
  avertissement: string | null;
  createdAt: string;
  insurance: { policyNumber: string; coverageType: string; insuredAmount: number; };
}

@Component({
  selector: 'app-remboursements-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './remboursements-admin.component.html',
  styleUrl: './remboursements-admin.css'
})
export class RemboursementsAdminComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private modalService = inject(NgbModal);
  private base = '/agri/remboursements';

  @ViewChild('detailModal') detailModal!: TemplateRef<any>;
  @ViewChild('approveModal') approveModal!: TemplateRef<any>;
  @ViewChild('rejectModal') rejectModal!: TemplateRef<any>;

  remboursements: RemboursementAdmin[] = [];
  stats: any = null;
  loading = true;
  successMessage: string | null = null;
  error: string | null = null;

  // Animation
  animatedStats = { total: 0, verses: 0, enAttente: 0, refuses: 0, montantTotalVerse: 0, montantEnAttente: 0 };
  donutSegments: any[] = [];
  readonly CIRCUMFERENCE = 2 * Math.PI * 54;

  // 🔧 IMPORTANT : Stocker les timers pour pouvoir les annuler
  private animationTimers: any[] = [];

  // Filtres
  selectedStatut: StatutRemboursement | '' = 'EN_ATTENTE';
  currentPage = 0; pageSize = 20; totalElements = 0; totalPages = 0;

  selectedRemboursement: RemboursementAdmin | null = null;
  approving = false;
  showAdjustment = false;
  montantAjuste: number | null = null;
  motifAjustement: string = '';
  rejecting = false;
  rejectReason = '';

  readonly STATUT_KEY = 'remboursements_admin_selectedStatut';

  ngOnInit() {
    try {
      const saved = localStorage.getItem(this.STATUT_KEY);
      const allowed: Array<StatutRemboursement | ''> = ['', 'EN_ATTENTE', 'APPROUVE', 'VERSE', 'REFUSE', 'ANNULE'];
      if (saved !== null && allowed.includes(saved as any)) {
        this.selectedStatut = saved as any;
      }
    } catch { }

    this.loadStats();
    this.loadRemboursements();
  }

  ngOnDestroy() {
    // Nettoyer tous les timers en cours
    this.clearAnimationTimers();
  }

  /** ✅ Annule toutes les animations en cours pour éviter les conflits */
  private clearAnimationTimers() {
    this.animationTimers.forEach(t => clearInterval(t));
    this.animationTimers = [];
  }

  loadStats() {
    this.http.get<any>(`${this.base}/admin/stats`).subscribe({
      next: data => {
        this.stats = data;
        this.animateCounters(data);
        this.buildDonut(data);
      },
      error: () => {
        this.error = 'Erreur de chargement des statistiques';
      }
    });
  }

  /** 🔧 Animation corrigée : annule l'ancienne avant de lancer la nouvelle */
  animateCounters(data: any) {
    // 1️⃣ Stopper toutes les animations précédentes
    this.clearAnimationTimers();

    // 2️⃣ Réinitialiser les valeurs affichées à 0
    this.animatedStats = { 
      total: 0, verses: 0, enAttente: 0, refuses: 0, 
      montantTotalVerse: 0, montantEnAttente: 0 
    };

    const keys = ['total', 'verses', 'enAttente', 'refuses', 'montantTotalVerse', 'montantEnAttente'] as const;
    const steps = 50;
    const duration = 800; // ms
    const intervalTime = duration / steps;

    keys.forEach(key => {
      const target = Number(data[key]) || 0;
      
      // Si la cible est 0, pas besoin d'animation
      if (target === 0) {
        (this.animatedStats as any)[key] = 0;
        return;
      }

      let current = 0;
      const increment = target / steps;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          (this.animatedStats as any)[key] = target; // Valeur finale exacte
          clearInterval(timer);
          // Retirer ce timer de la liste
          this.animationTimers = this.animationTimers.filter(t => t !== timer);
        } else {
          (this.animatedStats as any)[key] = Math.floor(current);
        }
      }, intervalTime);

      this.animationTimers.push(timer);
    });
  }

  buildDonut(data: any) {
    const total = data.total || 1;
    let offset = 0;
    this.donutSegments = [
      { label: 'Versés', v: data.verses || 0, c: '#22c55e' },
      { label: 'Attente', v: data.enAttente || 0, c: '#f59e0b' },
      { label: 'Refusés', v: data.refuses || 0, c: '#ef4444' }
    ].map(s => {
      const dash = (s.v / total) * this.CIRCUMFERENCE;
      const res = { ...s, dashArray: `${dash} ${this.CIRCUMFERENCE - dash}`, dashOffset: `-${offset}` };
      offset += dash;
      return res;
    });
  }

  loadRemboursements() {
    this.loading = true;
    let params = new HttpParams().set('page', this.currentPage).set('size', this.pageSize);
    if (this.selectedStatut) params = params.set('statut', this.selectedStatut);

    this.http.get<any>(`${this.base}/admin/all`, { params }).subscribe({
      next: page => {
        this.remboursements = page.content || [];
        this.totalElements = page.totalElements || 0;
        this.totalPages = page.totalPages || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Erreur de chargement';
      }
    });
  }

  toggleAdjustment() {
    this.showAdjustment = !this.showAdjustment;
    if (!this.showAdjustment) { this.montantAjuste = null; this.motifAjustement = ''; }
  }

  openApprove(r: RemboursementAdmin) {
    this.selectedRemboursement = r;
    this.showAdjustment = false;
    this.montantAjuste = null;
    this.motifAjustement = '';
    this.modalService.open(this.approveModal, { size: 'lg', centered: true });
  }

  confirmApprove() {
    if (!this.selectedRemboursement) return;
    this.approving = true;

    let params = new HttpParams();
    if (this.montantAjuste !== null && this.montantAjuste !== undefined) {
      params = params.set('montantAjuste', this.montantAjuste.toString());
    }
    if (this.motifAjustement?.trim()) {
      params = params.set('motifAjustement', this.motifAjustement.trim());
    }

    this.http.post<RemboursementAdmin>(
      `${this.base}/${this.selectedRemboursement.id}/approve`,
      {},
      { params }
    ).subscribe({
      next: (updated) => {
        this.approving = false;

        // Bascule sur "Tous les statuts" pour voir le résultat
        this.selectedStatut = '';
        this.currentPage = 0;
        try { localStorage.setItem(this.STATUT_KEY, this.selectedStatut); } catch { }

        // 🔄 Recharger les deux dans l'ordre
        this.loadStats();
        this.loadRemboursements();

        this.modalService.dismissAll();
        const montantVerse = this.montantAjuste ?? updated.montantFinalRembourse;
        this.showSuccess(`✅ Remboursement approuvé — ${montantVerse.toFixed(2)} TND.`);
      },
      error: (err) => {
        this.approving = false;
        this.error = err?.error?.message ?? 'Erreur lors de l\'approbation.';
      }
    });
  }

  confirmReject() {
    if (!this.selectedRemboursement || !this.rejectReason.trim()) return;
    this.rejecting = true;

    const params = new HttpParams().set('motif', this.rejectReason.trim());

    this.http.post<RemboursementAdmin>(
      `${this.base}/${this.selectedRemboursement.id}/reject`,
      {},
      { params }
    ).subscribe({
      next: () => {
        this.rejecting = false;

        this.selectedStatut = '';
        this.currentPage = 0;
        try { localStorage.setItem(this.STATUT_KEY, this.selectedStatut); } catch { }

        this.loadStats();
        this.loadRemboursements();

        this.modalService.dismissAll();
        this.showSuccess('❌ Remboursement refusé.');
      },
      error: (err) => {
        this.rejecting = false;
        this.error = err?.error?.message ?? 'Erreur lors du refus.';
      }
    });
  }

  openDetail(r: RemboursementAdmin) { 
    this.selectedRemboursement = r; 
    this.modalService.open(this.detailModal, { size: 'lg', centered: true }); 
  }
  
  openReject(r: RemboursementAdmin) { 
    this.selectedRemboursement = r; 
    this.rejectReason = ''; 
    this.modalService.open(this.rejectModal, { centered: true }); 
  }

  onStatutChange() {
    this.currentPage = 0;
    try { localStorage.setItem(this.STATUT_KEY, this.selectedStatut); } catch { }
    this.loadRemboursements();
  }

  goToPage(p: number) { 
    if (p < 0 || p >= this.totalPages) return;
    this.currentPage = p; 
    this.loadRemboursements(); 
  }
  
  get pages() { return Array.from({ length: this.totalPages }, (_, i) => i); }
  formatId(id: string) { return id ? '...' + id.slice(-8) : '—'; }
  private showSuccess(m: string) { this.successMessage = m; setTimeout(() => this.successMessage = null, 5000); }

  getStatutClass(s: string): string {
    const map: any = { 
      EN_ATTENTE: 'badge-pending', 
      VERSE: 'badge-success', 
      APPROUVE: 'badge-success',
      REFUSE: 'badge-danger',
      ANNULE: 'badge-danger'
    };
    return map[s] || 'badge-pending';
  }

  getStatutLabel(s: string): string {
    const map: any = { 
      EN_ATTENTE: 'En attente', 
      VERSE: 'Versé', 
      APPROUVE: 'Approuvé',
      REFUSE: 'Refusé',
      ANNULE: 'Annulé'
    };
    return map[s] || s;
  }
}
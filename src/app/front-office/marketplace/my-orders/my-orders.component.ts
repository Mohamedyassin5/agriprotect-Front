import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MarketplaceService } from '../marketplace.service';

const STATUS_STEPS = ['PENDING','CONFIRMED','SHIPPED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED'];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:          { label: 'En attente',       color: '#92400e', bg: '#fef3c7' },
  CONFIRMED:        { label: 'Confirmée',         color: '#1e40af', bg: '#dbeafe' },
  SHIPPED:          { label: 'Expédiée',          color: '#5b21b6', bg: '#ede9fe' },
  IN_TRANSIT:       { label: 'En transit',        color: '#0369a1', bg: '#e0f2fe' },
  OUT_FOR_DELIVERY: { label: 'En livraison',      color: '#065f46', bg: '#d1fae5' },
  DELIVERED:        { label: 'Livrée',            color: '#065f46', bg: '#d1fae5' },
  CANCELLED:        { label: 'Annulée',           color: '#b91c1c', bg: '#fee2e2' },
  REFUNDED:         { label: 'Remboursée',        color: '#6b7280', bg: '#f3f4f6' },
};

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div class="mo-page">
  <div class="mo-header">
    <div>
      <h4 class="mo-title">Mes commandes</h4>
      <p class="mo-sub">Historique de vos achats et suivi de livraison</p>
    </div>
    <a routerLink="/front-office/marketplace" class="mo-back-btn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
      Retour
    </a>
  </div>

  <div *ngIf="loading()" class="mo-loading"><div class="mo-spinner"></div></div>

  <div *ngIf="!loading() && orders().length === 0" class="mo-empty">
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    <p>Vous n'avez pas encore de commandes.</p>
    <a routerLink="/front-office/marketplace" class="mo-shop-btn">Parcourir la marketplace</a>
  </div>

  <div class="mo-list" *ngIf="!loading()">
    <div class="mo-card" *ngFor="let o of orders()">

      <!-- Header -->
      <div class="mo-card-head">
        <div>
          <div class="mo-product-title">{{ o.listingTitle }}</div>
          <div class="mo-meta">
            Vendeur : <strong>{{ o.sellerName }}</strong>
            &nbsp;·&nbsp; {{ o.createdAt | date:'dd/MM/yyyy HH:mm' }}
          </div>
        </div>
        <span class="mo-badge" [style.color]="meta(o.status).color" [style.background]="meta(o.status).bg">
          {{ meta(o.status).label }}
        </span>
      </div>

      <!-- Details -->
      <div class="mo-details">
        <div class="mo-detail">
          <span>Quantité</span><strong>{{ o.quantity }}</strong>
        </div>
        <div class="mo-detail">
          <span>Prix unitaire</span><strong>{{ o.unitPrice | number:'1.0-0' }} DT</strong>
        </div>
        <div class="mo-detail">
          <span>Total</span><strong class="mo-total">{{ o.totalPrice | number:'1.0-0' }} DT</strong>
        </div>
        <div class="mo-detail" *ngIf="o.deliveryAddress">
          <span>Adresse</span><strong>{{ o.deliveryAddress }}</strong>
        </div>
        <div class="mo-detail" *ngIf="o.trackingNumber">
          <span>N° de suivi</span>
          <strong class="mo-tracking-num">{{ o.trackingNumber }}</strong>
        </div>
        <div class="mo-detail" *ngIf="o.estimatedDelivery">
          <span>Livraison prévue</span>
          <strong>{{ o.estimatedDelivery | date:'dd/MM/yyyy' }}</strong>
        </div>
      </div>

      <!-- Seller note -->
      <div class="mo-seller-note" *ngIf="o.sellerNote">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>Note du vendeur : {{ o.sellerNote }}</span>
      </div>

      <!-- Tracking timeline (if not cancelled/refunded) -->
      <div class="mo-tracking" *ngIf="o.status !== 'CANCELLED' && o.status !== 'REFUNDED'">
        <div class="mo-tracking-header" (click)="toggleTracking(o.id)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.4 7h12.8"/></svg>
          Suivi de livraison
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:auto">
            <polyline *ngIf="!isOpen(o.id)" points="6 9 12 15 18 9"></polyline>
            <polyline *ngIf="isOpen(o.id)" points="18 15 12 9 6 15"></polyline>
          </svg>
        </div>

        <div *ngIf="isOpen(o.id)" class="mo-timeline-body">
          <!-- Step bar -->
          <div class="mo-steps">
            <div *ngFor="let step of STATUS_STEPS; let i = index" class="mo-step"
              [class.mo-step--done]="stepDone(o, step)"
              [class.mo-step--active]="o.status === step">
              <div class="mo-step-dot">
                <svg *ngIf="stepDone(o, step) && o.status !== step" width="9" height="9" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <div *ngIf="o.status === step" class="mo-dot-inner"></div>
              </div>
              <div class="mo-step-line" *ngIf="i < STATUS_STEPS.length - 1"></div>
            </div>
          </div>
          <div class="mo-step-names">
            <div *ngFor="let step of STATUS_STEPS" class="mo-step-name"
              [class.mo-step-name--done]="stepDone(o, step)"
              [class.mo-step-name--active]="o.status === step">
              {{ meta(step).label }}
            </div>
          </div>

          <!-- Event log -->
          <div class="mo-events" *ngIf="o.trackingEvents?.length > 0">
            <div class="mo-event" *ngFor="let ev of o.trackingEvents; let last = last">
              <div class="mo-ev-dot" [style.background]="meta(ev.status).color"></div>
              <div class="mo-ev-line" *ngIf="!last"></div>
              <div class="mo-ev-body">
                <div class="mo-ev-head">
                  <span class="mo-ev-status" [style.color]="meta(ev.status).color">{{ meta(ev.status).label }}</span>
                  <span class="mo-ev-date">{{ ev.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="mo-ev-desc">{{ ev.description }}</div>
                <div class="mo-ev-loc" *ngIf="ev.location">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {{ ev.location }}
                </div>
              </div>
            </div>
          </div>
          <p class="mo-no-events" *ngIf="!o.trackingEvents?.length">Aucun événement de suivi pour le moment.</p>
        </div>
      </div>

      <!-- Review -->
      <div class="mo-review-section" *ngIf="o.status === 'DELIVERED' && !o.hasReview">
        <div class="mo-review-prompt" *ngIf="reviewingId() !== o.id">
          <span>Vous avez reçu votre commande ?</span>
          <button class="mo-review-btn" (click)="startReview(o.id)">Laisser un avis</button>
        </div>
        <div class="mo-review-form" *ngIf="reviewingId() === o.id">
          <div class="mo-stars">
            <span *ngFor="let s of [1,2,3,4,5]" class="mo-star" [class.active]="reviewRating() >= s" (click)="reviewRating.set(s)">★</span>
          </div>
          <textarea class="mo-review-input" [(ngModel)]="reviewComment" placeholder="Votre avis…" rows="3"></textarea>
          <div class="mo-review-actions">
            <button class="mo-cancel-review" (click)="reviewingId.set(0)">Annuler</button>
            <button class="mo-submit-review" (click)="submitReview(o)">Publier</button>
          </div>
        </div>
      </div>
      <div class="mo-reviewed" *ngIf="o.hasReview">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Avis publié
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .mo-page { padding: 24px 28px; max-width: 900px; margin: 0 auto; font-family: 'Inter', sans-serif; }
    .mo-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .mo-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
    .mo-sub { font-size: .85rem; color: #64748b; margin: 0; }
    .mo-back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .82rem; color: #374151; text-decoration: none; font-weight: 500; }
    .mo-back-btn:hover { border-color: #2e8b57; color: #2e8b57; }
    .mo-loading { display: flex; justify-content: center; padding: 60px; }
    .mo-spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #2e8b57; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .mo-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: #94a3b8; text-align: center; }
    .mo-shop-btn { padding: 10px 20px; background: #2e8b57; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: .85rem; }
    .mo-list { display: flex; flex-direction: column; gap: 16px; }
    .mo-card { background: #fff; border-radius: 14px; border: 1px solid #e8edf2; box-shadow: 0 1px 4px rgba(0,0,0,.05); overflow: hidden; }

    /* HEAD */
    .mo-card-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 16px 20px 12px; border-bottom: 1px solid #f1f5f9; gap: 12px; flex-wrap: wrap; }
    .mo-product-title { font-size: .97rem; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .mo-meta { font-size: .75rem; color: #94a3b8; }
    .mo-badge { padding: 4px 12px; border-radius: 99px; font-size: .72rem; font-weight: 700; white-space: nowrap; }

    /* DETAILS */
    .mo-details { display: flex; gap: 20px; flex-wrap: wrap; padding: 14px 20px; border-bottom: 1px solid #f8fafc; }
    .mo-detail { display: flex; flex-direction: column; gap: 3px; }
    .mo-detail span { font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; }
    .mo-detail strong { font-size: .88rem; color: #0f172a; }
    .mo-total { color: #2e8b57 !important; font-size: .97rem !important; }
    .mo-tracking-num { font-family: 'DM Mono', monospace; color: #1e40af; background: #eff6ff; padding: 1px 7px; border-radius: 5px; }

    /* SELLER NOTE */
    .mo-seller-note { display: flex; align-items: flex-start; gap: 7px; margin: 0 20px 2px; padding: 8px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; font-size: .79rem; color: #78350f; }

    /* TRACKING */
    .mo-tracking { border-top: 1px solid #f1f5f9; }
    .mo-tracking-header { display: flex; align-items: center; gap: 7px; padding: 10px 20px; font-size: .78rem; color: #64748b; cursor: pointer; font-weight: 500; transition: color .15s; }
    .mo-tracking-header:hover { color: #2e8b57; }
    .mo-timeline-body { padding: 16px 20px; background: #fafbfc; border-top: 1px solid #f1f5f9; }
    .mo-steps { display: flex; align-items: center; margin-bottom: 6px; }
    .mo-step { display: flex; align-items: center; flex: 1; }
    .mo-step:last-child { flex: 0; }
    .mo-step-dot { width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid #e2e8f0; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .mo-step--done .mo-step-dot { background: #2e8b57; border-color: #2e8b57; }
    .mo-step--active .mo-step-dot { border-color: #2e8b57; box-shadow: 0 0 0 3px rgba(46,139,87,.2); }
    .mo-dot-inner { width: 7px; height: 7px; border-radius: 50%; background: #2e8b57; }
    .mo-step-line { flex: 1; height: 2px; background: #e2e8f0; margin: 0 2px; }
    .mo-step--done .mo-step-line { background: #2e8b57; }
    .mo-step-names { display: flex; margin-bottom: 18px; }
    .mo-step-name { flex: 1; font-size: .62rem; text-align: center; color: #94a3b8; font-weight: 500; padding: 0 2px; }
    .mo-step-name--done, .mo-step-name--active { color: #2e8b57; font-weight: 700; }
    .mo-events { display: flex; flex-direction: column; }
    .mo-event { display: grid; grid-template-columns: 14px 1px 1fr; gap: 0 10px; }
    .mo-ev-dot { width: 14px; height: 14px; border-radius: 50%; margin-top: 2px; }
    .mo-ev-line { width: 2px; background: #e2e8f0; min-height: 20px; margin: 3px auto; }
    .mo-ev-body { padding-bottom: 12px; }
    .mo-ev-head { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
    .mo-ev-status { font-size: .76rem; font-weight: 700; }
    .mo-ev-date { font-size: .7rem; color: #94a3b8; margin-left: auto; }
    .mo-ev-desc { font-size: .78rem; color: #374151; }
    .mo-ev-loc { display: flex; align-items: center; gap: 4px; font-size: .7rem; color: #94a3b8; margin-top: 2px; }
    .mo-no-events { font-size: .78rem; color: #94a3b8; text-align: center; padding: 10px 0 0; }

    /* REVIEW */
    .mo-review-section { border-top: 1px solid #f1f5f9; padding: 14px 20px; }
    .mo-review-prompt { display: flex; align-items: center; justify-content: space-between; }
    .mo-review-prompt span { font-size: .85rem; color: #374151; }
    .mo-review-btn { padding: 7px 16px; background: #f59e0b; color: #fff; border: none; border-radius: 8px; font-size: .82rem; font-weight: 700; cursor: pointer; }
    .mo-review-form { display: flex; flex-direction: column; gap: 10px; }
    .mo-stars { display: flex; gap: 4px; }
    .mo-star { font-size: 1.5rem; cursor: pointer; color: #d1d5db; transition: color .15s; }
    .mo-star.active { color: #f59e0b; }
    .mo-review-input { padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .85rem; resize: vertical; font-family: inherit; }
    .mo-review-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .mo-cancel-review { padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; cursor: pointer; font-size: .82rem; }
    .mo-submit-review { padding: 8px 16px; background: #2e8b57; color: #fff; border: none; border-radius: 8px; font-size: .82rem; font-weight: 600; cursor: pointer; }
    .mo-reviewed { color: #2e8b57; font-size: .79rem; font-weight: 600; display: flex; align-items: center; gap: 6px; padding: 12px 20px; border-top: 1px solid #f1f5f9; }
  `]
})
export class MyOrdersComponent implements OnInit {
  private svc = inject(MarketplaceService);

  readonly STATUS_STEPS = STATUS_STEPS;

  orders       = signal<any[]>([]);
  loading      = signal(true);
  reviewingId  = signal(0);
  reviewRating = signal(5);
  reviewComment = '';
  openTracking = signal<Set<number>>(new Set());

  ngOnInit() {
    this.svc.getMyOrders().subscribe({
      next: d => { this.orders.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  meta(s: string) { return STATUS_META[s] ?? { label: s, color: '#6b7280', bg: '#f3f4f6' }; }

  stepDone(order: any, step: string): boolean {
    return STATUS_STEPS.indexOf(step) <= STATUS_STEPS.indexOf(order.status);
  }

  toggleTracking(id: number): void {
    this.openTracking.update(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  isOpen(id: number): boolean { return this.openTracking().has(id); }

  startReview(id: number) { this.reviewingId.set(id); this.reviewRating.set(5); this.reviewComment = ''; }

  submitReview(o: any) {
    this.svc.addReview({ orderId: o.id, rating: this.reviewRating(), comment: this.reviewComment }).subscribe({
      next: () => {
        this.orders.update(list => list.map(x => x.id === o.id ? { ...x, hasReview: true } : x));
        this.reviewingId.set(0);
      }
    });
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MarketplaceService } from '../marketplace.service';

type FilterTab = 'ALL' | 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

const STATUS_STEPS = ['PENDING','CONFIRMED','SHIPPED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED'];

const STATUS_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  PENDING:          { label: 'En attente',       icon: '⏳', color: '#92400e', bg: '#fef3c7' },
  CONFIRMED:        { label: 'Confirmée',         icon: '✅', color: '#1e40af', bg: '#dbeafe' },
  SHIPPED:          { label: 'Expédiée',          icon: '📦', color: '#5b21b6', bg: '#ede9fe' },
  IN_TRANSIT:       { label: 'En transit',        icon: '🚚', color: '#0369a1', bg: '#e0f2fe' },
  OUT_FOR_DELIVERY: { label: 'En livraison',      icon: '🏠', color: '#065f46', bg: '#d1fae5' },
  DELIVERED:        { label: 'Livrée',            icon: '🎉', color: '#065f46', bg: '#d1fae5' },
  CANCELLED:        { label: 'Annulée',           icon: '❌', color: '#b91c1c', bg: '#fee2e2' },
  REFUNDED:         { label: 'Remboursée',        icon: '↩️', color: '#6b7280', bg: '#f3f4f6' },
};

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'SHIPPED',
  SHIPPED: 'IN_TRANSIT',
  IN_TRANSIT: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
};

const NEXT_LABEL: Record<string, string> = {
  PENDING: 'Confirmer la commande',
  CONFIRMED: 'Marquer expédiée',
  SHIPPED: 'En transit',
  IN_TRANSIT: 'En cours de livraison',
  OUT_FOR_DELIVERY: 'Marquer livrée',
};

@Component({
  selector: 'app-my-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div class="ms-page">

  <!-- ── HEADER ── -->
  <div class="ms-header">
    <div>
      <h2 class="ms-title">Mes Ventes</h2>
      <p class="ms-sub">Gérez vos commandes reçues et suivez les livraisons</p>
    </div>
    <div class="ms-header-actions">
      <a routerLink="/front-office/marketplace/my-listings" class="ms-btn ms-btn-outline">Mes annonces</a>
      <button class="ms-btn ms-btn-primary" (click)="load()" [disabled]="loading()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        Actualiser
      </button>
    </div>
  </div>

  <!-- ── STATS ── -->
  <div class="ms-stats" *ngIf="!loading()">
    <div class="ms-stat ms-stat-blue">
      <div class="ms-stat-val">{{ allSales().length }}</div>
      <div class="ms-stat-lbl">Total</div>
    </div>
    <div class="ms-stat ms-stat-orange">
      <div class="ms-stat-val">{{ count('PENDING') }}</div>
      <div class="ms-stat-lbl">En attente</div>
    </div>
    <div class="ms-stat ms-stat-purple">
      <div class="ms-stat-val">{{ count('SHIPPED') + count('IN_TRANSIT') + count('OUT_FOR_DELIVERY') }}</div>
      <div class="ms-stat-lbl">En cours</div>
    </div>
    <div class="ms-stat ms-stat-green">
      <div class="ms-stat-val">{{ count('DELIVERED') }}</div>
      <div class="ms-stat-lbl">Livrées</div>
    </div>
    <div class="ms-stat ms-stat-teal">
      <div class="ms-stat-val">{{ revenue() | number:'1.0-0' }} <span>DT</span></div>
      <div class="ms-stat-lbl">Chiffre d'affaires</div>
    </div>
  </div>

  <!-- ── FILTER TABS ── -->
  <div class="ms-tabs">
    <button *ngFor="let t of tabs" class="ms-tab" [class.ms-tab--active]="filter() === t.key"
      (click)="filter.set(t.key)">
      {{ t.label }}
      <span class="ms-tab-cnt" *ngIf="count(t.key) > 0 && t.key !== 'ALL'">{{ count(t.key) }}</span>
    </button>
  </div>

  <!-- ── LOADING ── -->
  <div *ngIf="loading()" class="ms-loading">
    <div class="ms-spinner"></div>
    <p>Chargement de vos ventes…</p>
  </div>

  <!-- ── EMPTY ── -->
  <div *ngIf="!loading() && filteredSales().length === 0" class="ms-empty">
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.4 7h12.8"/></svg>
    <p>{{ filter() === 'ALL' ? 'Aucune vente pour le moment.' : 'Aucune commande dans cette catégorie.' }}</p>
    <a routerLink="/front-office/marketplace/publish" class="ms-btn ms-btn-primary" style="margin-top:8px">Publier une annonce</a>
  </div>

  <!-- ── ORDER CARDS ── -->
  <div class="ms-list" *ngIf="!loading()">
    <div class="ms-card" *ngFor="let o of filteredSales()">

      <!-- Card Header -->
      <div class="ms-card-head">
        <div class="ms-buyer">
          <div class="ms-avatar">{{ initials(o.buyerName) }}</div>
          <div>
            <div class="ms-buyer-name">{{ o.buyerName }}</div>
            <div class="ms-buyer-email">{{ o.buyerEmail }}</div>
          </div>
        </div>
        <div class="ms-head-right">
          <span class="ms-status-badge" [style.color]="meta(o.status).color" [style.background]="meta(o.status).bg">
            {{ meta(o.status).icon }} {{ meta(o.status).label }}
          </span>
          <div class="ms-order-date">{{ o.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
        </div>
      </div>

      <!-- Product row -->
      <div class="ms-product-row">
        <div class="ms-product-img" *ngIf="o.listingImageUrl">
          <img [src]="o.listingImageUrl" [alt]="o.listingTitle" />
        </div>
        <div class="ms-product-img ms-product-img--placeholder" *ngIf="!o.listingImageUrl">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 9 6 6m0-6-6 6"/></svg>
        </div>
        <div class="ms-product-info">
          <div class="ms-product-title">{{ o.listingTitle }}</div>
          <div class="ms-product-meta">
            Qté : <strong>{{ o.quantity }}</strong> &nbsp;·&nbsp;
            PU : <strong>{{ o.unitPrice | number:'1.0-0' }} DT</strong> &nbsp;·&nbsp;
            Total : <strong class="ms-total">{{ o.totalPrice | number:'1.0-0' }} DT</strong>
          </div>
          <div class="ms-delivery-addr" *ngIf="o.deliveryAddress">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ o.deliveryAddress }}
          </div>
        </div>
        <div class="ms-tracking-block" *ngIf="o.trackingNumber">
          <div class="ms-tracking-label">N° de suivi</div>
          <div class="ms-tracking-number">{{ o.trackingNumber }}</div>
          <div class="ms-estimated" *ngIf="o.estimatedDelivery">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Livraison prévue le {{ o.estimatedDelivery | date:'dd/MM/yyyy' }}
          </div>
        </div>
      </div>

      <!-- Seller note -->
      <div class="ms-seller-note" *ngIf="o.sellerNote">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        {{ o.sellerNote }}
      </div>

      <!-- Tracking Timeline -->
      <div class="ms-timeline-toggle" (click)="toggleTracking(o.id)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline *ngIf="!isTrackingOpen(o.id)" points="6 9 12 15 18 9"></polyline>
          <polyline *ngIf="isTrackingOpen(o.id)" points="18 15 12 9 6 15"></polyline>
        </svg>
        {{ isTrackingOpen(o.id) ? 'Masquer' : 'Voir' }} le suivi de livraison
        <span *ngIf="o.trackingEvents?.length > 0">({{ o.trackingEvents.length }} étape{{ o.trackingEvents.length > 1 ? 's' : '' }})</span>
      </div>

      <div class="ms-timeline" *ngIf="isTrackingOpen(o.id)">
        <div class="ms-timeline-steps">
          <div *ngFor="let step of STATUS_STEPS; let i = index" class="ms-step"
            [class.ms-step--done]="stepDone(o, step)"
            [class.ms-step--active]="o.status === step">
            <div class="ms-step-dot">
              <svg *ngIf="stepDone(o, step) && o.status !== step" width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <div *ngIf="o.status === step" class="ms-step-dot-inner"></div>
            </div>
            <div class="ms-step-line" *ngIf="i < STATUS_STEPS.length - 1"></div>
          </div>
        </div>
        <div class="ms-step-labels">
          <div *ngFor="let step of STATUS_STEPS" class="ms-step-label"
            [class.ms-step-label--done]="stepDone(o, step)"
            [class.ms-step-label--active]="o.status === step">
            {{ meta(step).label }}
          </div>
        </div>

        <div class="ms-events" *ngIf="o.trackingEvents?.length > 0">
          <div class="ms-event" *ngFor="let ev of o.trackingEvents; let last = last" [class.ms-event--last]="last">
            <div class="ms-event-dot" [style.background]="meta(ev.status).color"></div>
            <div class="ms-event-line" *ngIf="!last"></div>
            <div class="ms-event-body">
              <div class="ms-event-header">
                <span class="ms-event-status" [style.color]="meta(ev.status).color">{{ meta(ev.status).label }}</span>
                <span class="ms-event-date">{{ ev.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="ms-event-desc">{{ ev.description }}</div>
              <div class="ms-event-loc" *ngIf="ev.location">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {{ ev.location }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── ACTION ZONE ── -->
      <div class="ms-actions" *ngIf="actionId() !== o.id">
        <button class="ms-btn ms-btn-next" *ngIf="NEXT_STATUS[o.status]"
          (click)="startAction(o.id, NEXT_STATUS[o.status])">
          {{ NEXT_LABEL[o.status] }}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
        <button class="ms-btn ms-btn-cancel-order"
          *ngIf="o.status === 'PENDING' || o.status === 'CONFIRMED'"
          (click)="startAction(o.id, 'CANCELLED')">
          Annuler
        </button>
      </div>

      <!-- Inline action form -->
      <div class="ms-action-form" *ngIf="actionId() === o.id">
        <div class="ms-action-title"
          [class.ms-action-title--progress]="actionStatus() !== 'CANCELLED'"
          [class.ms-action-title--cancel]="actionStatus() === 'CANCELLED'">
          {{ actionStatus() === 'CANCELLED' ? "❌ Confirmer l'annulation" : "📦 " + meta(actionStatus() ?? '').label }}
        </div>
        <div class="ms-form-row">
          <div class="ms-form-group">
            <label>Note (optionnelle)</label>
            <input type="text" [(ngModel)]="actionNote" placeholder="Message pour l'acheteur…" />
          </div>
          <div class="ms-form-group">
            <label>Lieu (optionnel)</label>
            <input type="text" [(ngModel)]="actionLocation" placeholder="Ex: Tunis, Centre de tri…" />
          </div>
          <div class="ms-form-group" *ngIf="actionStatus() === 'CONFIRMED' || actionStatus() === 'SHIPPED'">
            <label>Date de livraison estimée</label>
            <input type="date" [(ngModel)]="actionEstimated" />
          </div>
        </div>
        <div class="ms-error-msg" *ngIf="errorMsg() && actionId() === o.id">
          ⚠️ {{ errorMsg() }}
        </div>
        <div class="ms-action-btns">
          <button class="ms-btn ms-btn-confirm"
            [class.ms-btn-confirm--cancel]="actionStatus() === 'CANCELLED'"
            (click)="confirmAction(o)"
            [disabled]="savingId() === o.id">
            <span *ngIf="savingId() === o.id" class="ms-saving-dot"></span>
            {{ savingId() === o.id ? 'En cours…' : 'Confirmer' }}
          </button>
          <button class="ms-btn ms-btn-outline" (click)="cancelAction()" [disabled]="savingId() === o.id">Annuler</button>
        </div>
      </div>

    </div>
  </div>
</div>
  `,
  styles: [`
    .ms-page { padding: 28px 32px; max-width: 1100px; margin: 0 auto; font-family: 'Inter', sans-serif; }

    /* HEADER */
    .ms-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
    .ms-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
    .ms-sub { font-size: .875rem; color: #64748b; margin: 0; }
    .ms-header-actions { display: flex; gap: 10px; }

    /* BUTTONS */
    .ms-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 8px; font-size: .85rem; font-weight: 600; cursor: pointer; border: none; transition: all .18s; text-decoration: none; }
    .ms-btn:disabled { opacity: .5; cursor: not-allowed; }
    .ms-btn-primary { background: #2e8b57; color: #fff; }
    .ms-btn-primary:hover:not(:disabled) { background: #246b43; }
    .ms-btn-outline { background: #fff; color: #374151; border: 1.5px solid #e2e8f0; }
    .ms-btn-outline:hover { border-color: #2e8b57; color: #2e8b57; }
    .ms-btn-next { background: linear-gradient(135deg, #2e8b57, #3cb371); color: #fff; padding: 9px 20px; }
    .ms-btn-next:hover { background: linear-gradient(135deg, #246b43, #2e8b57); }
    .ms-btn-cancel-order { background: #fff; color: #b91c1c; border: 1.5px solid #fecaca; font-size: .82rem; }
    .ms-btn-cancel-order:hover { background: #fee2e2; }
    .ms-btn-confirm { background: #2e8b57; color: #fff; }
    .ms-btn-confirm--cancel { background: #dc2626; }

    /* STATS */
    .ms-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 26px; }
    .ms-stat { background: #fff; border-radius: 12px; padding: 18px 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); border: 1px solid #f1f5f9; text-align: center; }
    .ms-stat-val { font-size: 1.7rem; font-weight: 800; margin-bottom: 4px; }
    .ms-stat-val span { font-size: .9rem; font-weight: 500; }
    .ms-stat-lbl { font-size: .75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
    .ms-stat-blue   .ms-stat-val { color: #1e40af; }
    .ms-stat-orange .ms-stat-val { color: #d97706; }
    .ms-stat-purple .ms-stat-val { color: #7c3aed; }
    .ms-stat-green  .ms-stat-val { color: #059669; }
    .ms-stat-teal   .ms-stat-val { color: #0e7490; }

    /* TABS */
    .ms-tabs { display: flex; gap: 4px; background: #f8fafc; border-radius: 10px; padding: 5px; margin-bottom: 22px; overflow-x: auto; border: 1px solid #e2e8f0; }
    .ms-tab { display: flex; align-items: center; gap: 5px; padding: 7px 14px; border: none; background: transparent; border-radius: 7px; font-size: .82rem; color: #64748b; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all .15s; }
    .ms-tab:hover { background: #fff; color: #0f172a; }
    .ms-tab--active { background: #fff; color: #2e8b57; font-weight: 700; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .ms-tab-cnt { background: #2e8b57; color: #fff; border-radius: 99px; font-size: .68rem; font-weight: 700; padding: 1px 6px; min-width: 18px; text-align: center; }

    /* LOADING / EMPTY */
    .ms-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: #94a3b8; }
    .ms-spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #2e8b57; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ms-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 20px; color: #94a3b8; text-align: center; }

    /* LIST */
    .ms-list { display: flex; flex-direction: column; gap: 16px; }

    /* CARD */
    .ms-card { background: #fff; border-radius: 14px; border: 1px solid #e8edf2; box-shadow: 0 1px 6px rgba(0,0,0,.05); overflow: hidden; transition: box-shadow .2s; }
    .ms-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }

    /* CARD HEAD */
    .ms-card-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px 12px; border-bottom: 1px solid #f1f5f9; flex-wrap: wrap; gap: 10px; }
    .ms-buyer { display: flex; align-items: center; gap: 12px; }
    .ms-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #2e8b57, #52b788); color: #fff; font-size: .85rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; text-transform: uppercase; }
    .ms-buyer-name { font-weight: 700; font-size: .9rem; color: #0f172a; }
    .ms-buyer-email { font-size: .75rem; color: #94a3b8; }
    .ms-head-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .ms-status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 99px; font-size: .75rem; font-weight: 700; }
    .ms-order-date { font-size: .72rem; color: #94a3b8; }

    /* PRODUCT ROW */
    .ms-product-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 20px; border-bottom: 1px solid #f8fafc; }
    .ms-product-img { width: 64px; height: 64px; border-radius: 10px; overflow: hidden; flex-shrink: 0; border: 1px solid #e8edf2; }
    .ms-product-img img { width: 100%; height: 100%; object-fit: cover; }
    .ms-product-img--placeholder { background: #f8fafc; display: flex; align-items: center; justify-content: center; }
    .ms-product-info { flex: 1; }
    .ms-product-title { font-weight: 700; font-size: .95rem; color: #0f172a; margin-bottom: 5px; }
    .ms-product-meta { font-size: .8rem; color: #64748b; margin-bottom: 4px; }
    .ms-total { color: #2e8b57 !important; }
    .ms-delivery-addr { display: flex; align-items: center; gap: 4px; font-size: .75rem; color: #94a3b8; margin-top: 4px; }
    .ms-tracking-block { text-align: right; flex-shrink: 0; }
    .ms-tracking-label { font-size: .68rem; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: 3px; }
    .ms-tracking-number { font-family: 'DM Mono', monospace; font-size: .82rem; font-weight: 700; color: #1e40af; background: #eff6ff; padding: 3px 8px; border-radius: 6px; }
    .ms-estimated { display: flex; align-items: center; gap: 4px; font-size: .72rem; color: #64748b; margin-top: 6px; justify-content: flex-end; }

    /* SELLER NOTE */
    .ms-seller-note { display: flex; align-items: flex-start; gap: 7px; margin: 0 20px 10px; padding: 8px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; font-size: .8rem; color: #78350f; }

    /* TRACKING TOGGLE */
    .ms-timeline-toggle { display: flex; align-items: center; gap: 6px; padding: 10px 20px; font-size: .78rem; color: #64748b; cursor: pointer; border-top: 1px solid #f8fafc; transition: color .15s; }
    .ms-timeline-toggle:hover { color: #2e8b57; }

    /* TIMELINE */
    .ms-timeline { padding: 16px 20px; border-top: 1px solid #f1f5f9; background: #fafbfc; }
    .ms-timeline-steps { display: flex; align-items: center; margin-bottom: 8px; }
    .ms-step { display: flex; align-items: center; flex: 1; }
    .ms-step:last-child { flex: 0; }
    .ms-step-dot { width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid #e2e8f0; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .2s; }
    .ms-step--done .ms-step-dot { background: #2e8b57; border-color: #2e8b57; }
    .ms-step--active .ms-step-dot { border-color: #2e8b57; box-shadow: 0 0 0 3px rgba(46,139,87,.2); }
    .ms-step-dot-inner { width: 8px; height: 8px; border-radius: 50%; background: #2e8b57; }
    .ms-step-line { flex: 1; height: 2.5px; background: #e2e8f0; margin: 0 2px; }
    .ms-step--done + .ms-step .ms-step-line,
    .ms-step--done .ms-step-line { background: #2e8b57; }
    .ms-step-labels { display: flex; margin-bottom: 18px; }
    .ms-step-label { flex: 1; font-size: .65rem; text-align: center; color: #94a3b8; font-weight: 500; padding: 0 2px; }
    .ms-step-label--done, .ms-step-label--active { color: #2e8b57; font-weight: 700; }

    /* EVENTS */
    .ms-events { display: flex; flex-direction: column; gap: 0; }
    .ms-event { display: grid; grid-template-columns: 16px 1px 1fr; gap: 0 10px; align-items: start; }
    .ms-event-dot { width: 16px; height: 16px; border-radius: 50%; margin-top: 2px; flex-shrink: 0; }
    .ms-event-line { width: 2px; background: #e2e8f0; min-height: 24px; margin: 4px auto; }
    .ms-event--last .ms-event-line { display: none; }
    .ms-event-body { padding-bottom: 14px; }
    .ms-event-header { display: flex; align-items: center; gap: 10px; margin-bottom: 3px; }
    .ms-event-status { font-size: .78rem; font-weight: 700; }
    .ms-event-date { font-size: .72rem; color: #94a3b8; margin-left: auto; }
    .ms-event-desc { font-size: .8rem; color: #374151; margin-bottom: 3px; }
    .ms-event-loc { display: flex; align-items: center; gap: 4px; font-size: .72rem; color: #94a3b8; }

    /* ACTIONS */
    .ms-actions { display: flex; align-items: center; gap: 10px; padding: 14px 20px 16px; border-top: 1px solid #f1f5f9; }

    /* ACTION FORM */
    .ms-action-form { border-top: 1px solid #f1f5f9; padding: 16px 20px; }
    .ms-action-title { padding: 8px 14px; border-radius: 8px; font-size: .85rem; font-weight: 700; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
    .ms-action-title--progress { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .ms-action-title--cancel { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .ms-form-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
    .ms-form-group { flex: 1; min-width: 180px; }
    .ms-form-group label { display: block; font-size: .75rem; color: #64748b; margin-bottom: 5px; font-weight: 500; }
    .ms-form-group input { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .85rem; background: #f8fafc; box-sizing: border-box; color: #0f172a; }
    .ms-form-group input:focus { outline: none; border-color: #2e8b57; background: #fff; }
    .ms-action-btns { display: flex; gap: 10px; align-items: center; }
    .ms-error-msg { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 8px 14px; font-size: .82rem; color: #b91c1c; margin-bottom: 10px; }
    .ms-saving-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.6); border: 2px solid #fff; animation: spin .6s linear infinite; }

    @media (max-width: 700px) {
      .ms-page { padding: 16px; }
      .ms-stats { grid-template-columns: repeat(3, 1fr); }
      .ms-product-row { flex-wrap: wrap; }
      .ms-tracking-block { text-align: left; }
      .ms-form-row { flex-direction: column; }
    }
  `]
})
export class MySalesComponent implements OnInit {
  private svc = inject(MarketplaceService);

  readonly STATUS_STEPS = STATUS_STEPS;
  readonly NEXT_STATUS = NEXT_STATUS;
  readonly NEXT_LABEL = NEXT_LABEL;

  allSales   = signal<any[]>([]);
  loading    = signal(true);
  savingId   = signal<number | null>(null);
  errorMsg   = signal<string | null>(null);
  filter     = signal<FilterTab>('ALL');
  openTracking = signal<Set<number>>(new Set());

  actionId       = signal<number | null>(null);
  actionStatus   = signal<string | null>(null);
  actionNote     = '';
  actionLocation = '';
  actionEstimated = '';

  tabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL',              label: 'Toutes' },
    { key: 'PENDING',          label: 'En attente' },
    { key: 'CONFIRMED',        label: 'Confirmées' },
    { key: 'SHIPPED',          label: 'Expédiées' },
    { key: 'IN_TRANSIT',       label: 'En transit' },
    { key: 'OUT_FOR_DELIVERY', label: 'En livraison' },
    { key: 'DELIVERED',        label: 'Livrées' },
    { key: 'CANCELLED',        label: 'Annulées' },
  ];

  ngOnInit() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getMySales().subscribe({
      next: d => { this.allSales.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  filteredSales(): any[] {
    const f = this.filter();
    return f === 'ALL' ? this.allSales() : this.allSales().filter(o => o.status === f);
  }

  count(status: string): number {
    if (status === 'ALL') return this.allSales().length;
    return this.allSales().filter(o => o.status === status).length;
  }

  revenue(): number {
    return this.allSales()
      .filter(o => o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
      .reduce((s, o) => s + (o.totalPrice ?? 0), 0);
  }

  meta(status: string) { return STATUS_META[status] ?? { label: status, icon: '•', color: '#6b7280', bg: '#f3f4f6' }; }

  initials(name: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
  }

  stepDone(order: any, step: string): boolean {
    const idx = STATUS_STEPS.indexOf(step);
    const curr = STATUS_STEPS.indexOf(order.status);
    return curr >= idx;
  }

  toggleTracking(id: number): void {
    this.openTracking.update(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  isTrackingOpen(id: number): boolean { return this.openTracking().has(id); }

  startAction(orderId: number, status: string): void {
    this.actionId.set(orderId);
    this.actionStatus.set(status);
    this.actionNote = '';
    this.actionLocation = '';
    this.actionEstimated = '';
    this.openTracking.update(s => { const n = new Set(s); n.add(orderId); return n; });
  }

  cancelAction(): void {
    this.actionId.set(null);
    this.actionStatus.set(null);
    this.errorMsg.set(null);
  }

  confirmAction(order: any): void {
    const status = this.actionStatus();
    if (!status) return;
    this.savingId.set(order.id);
    this.errorMsg.set(null);
    const req: any = { status };
    if (this.actionNote) req.note = this.actionNote;
    if (this.actionLocation) req.location = this.actionLocation;
    if (this.actionEstimated) req.estimatedDelivery = this.actionEstimated;

    this.svc.updateOrderStatus(order.id, req).subscribe({
      next: updated => {
        this.allSales.update(list => list.map(o => o.id === order.id ? updated : o));
        this.cancelAction();
        this.savingId.set(null);
      },
      error: (err) => {
        const raw = err?.error?.message ?? err?.error ?? err?.message ?? 'Erreur lors de la mise à jour';
        this.errorMsg.set(typeof raw === 'string' ? raw : 'Erreur lors de la mise à jour du statut');
        this.savingId.set(null);
      }
    });
  }
}

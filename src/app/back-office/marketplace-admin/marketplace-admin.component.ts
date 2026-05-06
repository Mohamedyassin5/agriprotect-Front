import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketplaceService } from '../../front-office/marketplace/marketplace.service';

@Component({
  selector: 'app-marketplace-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ma-page">

      <!-- ── Page Header ── -->
      <div class="ma-page-header">
        <div>
          <h4 class="ma-page-title">
            <i class="feather icon-shopping-bag"></i>
            Marketplace Admin
          </h4>
          <p class="ma-page-sub">Gestion des annonces et commandes de la marketplace</p>
        </div>
        <button class="ma-refresh-btn" (click)="loadAll()" [disabled]="loading()">
          <i class="feather icon-refresh-cw" [class.ma-spinning]="loading()"></i>
          Actualiser
        </button>
      </div>

      <!-- ── Loading ── -->
      <div *ngIf="loading()" class="ma-loading">
        <div class="ma-spinner"></div>
        <p>Chargement des données...</p>
      </div>

      <!-- ── Tabs ── -->
      <div class="ma-tabs">
        <button class="ma-tab" [class.ma-tab--active]="tab() === 'pending'" (click)="tab.set('pending')">
          <i class="feather icon-clock"></i>
          En attente
          <span class="ma-tab-badge" *ngIf="pending().length > 0">{{ pending().length }}</span>
        </button>
        <button class="ma-tab" [class.ma-tab--active]="tab() === 'orders'" (click)="tab.set('orders')">
          <i class="feather icon-package"></i>
          Commandes
          <span class="ma-tab-badge" *ngIf="orders().length > 0">{{ orders().length }}</span>
        </button>
        <button class="ma-tab" [class.ma-tab--active]="tab() === 'overview'" (click)="tab.set('overview')">
          <i class="feather icon-bar-chart-2"></i>
          Aperçu
        </button>
      </div>

      <!-- ════════════ TAB: EN ATTENTE ════════════ -->
      <div *ngIf="tab() === 'pending' && !loading()">
        <div *ngIf="pending().length === 0" class="ma-empty">
          <i class="feather icon-check-circle"></i>
          <p>Aucune annonce en attente de validation.</p>
        </div>

        <div class="ma-pending-grid" *ngIf="pending().length > 0">
          <div class="ma-listing-card" *ngFor="let listing of pending()">
            <!-- Image -->
            <div class="ma-listing-img-wrap">
              <img
                *ngIf="listing.imageUrls && listing.imageUrls.length > 0"
                [src]="listing.imageUrls[0]"
                [alt]="listing.title"
                class="ma-listing-img"
                (error)="onImgError($event)"
              />
              <div *ngIf="!listing.imageUrls || listing.imageUrls.length === 0" class="ma-listing-img-placeholder">
                <i class="feather icon-image"></i>
              </div>
              <span class="ma-listing-category-badge">{{ listing.category }}</span>
            </div>

            <!-- Body -->
            <div class="ma-listing-body">
              <h5 class="ma-listing-title">{{ listing.title }}</h5>
              <div class="ma-listing-meta">
                <span class="ma-meta-item">
                  <i class="feather icon-user"></i>
                  {{ listing.sellerName || listing.seller?.firstName + ' ' + listing.seller?.lastName || 'N/A' }}
                </span>
                <span class="ma-meta-item">
                  <i class="feather icon-tag"></i>
                  {{ listing.type }}
                </span>
                <span class="ma-meta-item ma-price">
                  <i class="feather icon-dollar-sign"></i>
                  {{ listing.price | number:'1.2-2' }} DT
                  <small *ngIf="listing.unit">/ {{ listing.unit }}</small>
                </span>
              </div>

              <p class="ma-listing-desc" *ngIf="listing.description">
                {{ listing.description | slice:0:120 }}{{ listing.description?.length > 120 ? '...' : '' }}
              </p>

              <!-- Action Buttons -->
              <div class="ma-listing-actions" *ngIf="actionId() !== listing.id">
                <button class="ma-btn ma-btn-approve" (click)="approve(listing.id)" [disabled]="loading()">
                  <i class="feather icon-check"></i> Approuver
                </button>
                <button class="ma-btn ma-btn-reject" (click)="startReject(listing.id)" [disabled]="loading()">
                  <i class="feather icon-x"></i> Rejeter
                </button>
              </div>

              <!-- Rejection inline form -->
              <div class="ma-reject-form" *ngIf="actionId() === listing.id">
                <label class="ma-reject-label">Motif du rejet</label>
                <textarea
                  class="ma-reject-input"
                  [(ngModel)]="rejectNoteModel"
                  placeholder="Expliquer la raison du rejet..."
                  rows="3"
                ></textarea>
                <div class="ma-reject-btns">
                  <button class="ma-btn ma-btn-reject" (click)="confirmReject(listing.id)" [disabled]="loading()">
                    <i class="feather icon-x-circle"></i> Confirmer le rejet
                  </button>
                  <button class="ma-btn ma-btn-cancel" (click)="cancelAction()">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ════════════ TAB: COMMANDES ════════════ -->
      <div *ngIf="tab() === 'orders' && !loading()">
        <div *ngIf="orders().length === 0" class="ma-empty">
          <i class="feather icon-inbox"></i>
          <p>Aucune commande trouvée.</p>
        </div>

        <div class="ma-table-wrap" *ngIf="orders().length > 0">
          <table class="ma-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Annonce</th>
                <th>Acheteur</th>
                <th>Vendeur</th>
                <th>Qté</th>
                <th>Total</th>
                <th>Paiement</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of orders()">
                <td class="ma-td-id">#{{ order.id }}</td>
                <td class="ma-td-listing">{{ order.listingTitle || order.listing?.title || '—' }}</td>
                <td>
                  <div class="ma-user-cell">
                    <span>{{ order.buyerName || order.buyer?.firstName + ' ' + order.buyer?.lastName || '—' }}</span>
                    <small class="ma-cell-email">{{ order.buyer?.email || '' }}</small>
                  </div>
                </td>
                <td>
                  <div class="ma-user-cell">
                    <span>{{ order.sellerName || order.seller?.firstName + ' ' + order.seller?.lastName || '—' }}</span>
                    <small class="ma-cell-email">{{ order.seller?.email || '' }}</small>
                  </div>
                </td>
                <td class="ma-td-num">{{ order.quantity }}</td>
                <td class="ma-td-num ma-price">{{ order.totalPrice | number:'1.2-2' }} DT</td>
                <td>
                  <span class="ma-payment-badge" [class]="'ma-pay-' + (order.paymentSource || 'unknown')?.toLowerCase()">
                    {{ order.paymentSource || '—' }}
                  </span>
                </td>
                <td>
                  <span class="ma-status-badge" [class]="'ma-status-' + (order.status || 'unknown')?.toLowerCase()">
                    {{ order.status || '—' }}
                  </span>
                </td>
                <td class="ma-td-date">{{ order.createdAt | date:'dd/MM/yyyy' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ════════════ TAB: APERÇU ════════════ -->
      <div *ngIf="tab() === 'overview' && !loading()">
        <div *ngIf="!overview()" class="ma-empty">
          <i class="feather icon-bar-chart-2"></i>
          <p>Données d'aperçu indisponibles.</p>
        </div>

        <div class="ma-kpi-grid" *ngIf="overview()">
          <div class="ma-kpi-card ma-kpi-blue">
            <div class="ma-kpi-icon"><i class="feather icon-list"></i></div>
            <div class="ma-kpi-body">
              <span class="ma-kpi-label">Total Annonces</span>
              <span class="ma-kpi-val">{{ overview()?.totalListings ?? 0 }}</span>
            </div>
          </div>
          <div class="ma-kpi-card ma-kpi-orange">
            <div class="ma-kpi-icon"><i class="feather icon-clock"></i></div>
            <div class="ma-kpi-body">
              <span class="ma-kpi-label">En Attente</span>
              <span class="ma-kpi-val">{{ overview()?.pendingListings ?? 0 }}</span>
            </div>
          </div>
          <div class="ma-kpi-card ma-kpi-green">
            <div class="ma-kpi-icon"><i class="feather icon-check-circle"></i></div>
            <div class="ma-kpi-body">
              <span class="ma-kpi-label">Annonces Actives</span>
              <span class="ma-kpi-val">{{ overview()?.activeListings ?? 0 }}</span>
            </div>
          </div>
          <div class="ma-kpi-card ma-kpi-teal">
            <div class="ma-kpi-icon"><i class="feather icon-package"></i></div>
            <div class="ma-kpi-body">
              <span class="ma-kpi-label">Total Commandes</span>
              <span class="ma-kpi-val">{{ overview()?.totalOrders ?? 0 }}</span>
            </div>
          </div>
          <div class="ma-kpi-card ma-kpi-emerald">
            <div class="ma-kpi-icon"><i class="feather icon-shopping-cart"></i></div>
            <div class="ma-kpi-body">
              <span class="ma-kpi-label">Commandes Livrées</span>
              <span class="ma-kpi-val">{{ overview()?.deliveredOrders ?? 0 }}</span>
            </div>
          </div>
          <div class="ma-kpi-card ma-kpi-gold">
            <div class="ma-kpi-icon"><i class="feather icon-trending-up"></i></div>
            <div class="ma-kpi-body">
              <span class="ma-kpi-label">Revenu Total</span>
              <span class="ma-kpi-val">{{ (overview()?.totalRevenue ?? 0) | number:'1.0-0' }} <small>DT</small></span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ── Layout ── */
    .ma-page {
      background: #1a1f2e;
      min-height: 100vh;
      padding: 28px 32px;
      color: #ffffff;
      font-family: 'Inter', 'DM Sans', sans-serif;
    }

    /* ── Header ── */
    .ma-page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 28px;
    }
    .ma-page-title {
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 6px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ma-page-title i {
      color: #52b788;
      font-size: 20px;
    }
    .ma-page-sub {
      color: rgba(255,255,255,0.45);
      font-size: 13px;
      margin: 0;
    }
    .ma-refresh-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(82,183,136,0.15);
      border: 1px solid rgba(82,183,136,0.3);
      color: #52b788;
      padding: 9px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .ma-refresh-btn:hover:not(:disabled) {
      background: rgba(82,183,136,0.25);
      border-color: rgba(82,183,136,0.5);
    }
    .ma-refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ── Loading ── */
    .ma-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: rgba(255,255,255,0.45);
      gap: 14px;
    }
    .ma-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(82,183,136,0.2);
      border-top-color: #52b788;
      border-radius: 50%;
      animation: ma-spin 0.8s linear infinite;
    }
    @keyframes ma-spin { to { transform: rotate(360deg); } }
    @keyframes ma-spin-icon { to { transform: rotate(360deg); } }
    .ma-spinning { animation: ma-spin-icon 0.8s linear infinite; display: inline-block; }

    /* ── Tabs ── */
    .ma-tabs {
      display: flex;
      gap: 4px;
      background: #232a3b;
      border-radius: 12px;
      padding: 6px;
      margin-bottom: 24px;
      border: 1px solid rgba(255,255,255,0.06);
      width: fit-content;
    }
    .ma-tab {
      display: flex;
      align-items: center;
      gap: 7px;
      background: transparent;
      border: none;
      color: rgba(255,255,255,0.5);
      padding: 9px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .ma-tab:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.05); }
    .ma-tab--active {
      background: #52b788 !important;
      color: #0d1117 !important;
      font-weight: 600;
    }
    .ma-tab-badge {
      background: rgba(0,0,0,0.25);
      color: inherit;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 10px;
      min-width: 20px;
      text-align: center;
    }
    .ma-tab--active .ma-tab-badge {
      background: rgba(0,0,0,0.2);
    }

    /* ── Empty state ── */
    .ma-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      color: rgba(255,255,255,0.3);
      gap: 12px;
    }
    .ma-empty i { font-size: 48px; }
    .ma-empty p { font-size: 14px; margin: 0; }

    /* ── Pending Grid ── */
    .ma-pending-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    .ma-listing-card {
      background: #232a3b;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .ma-listing-card:hover {
      border-color: rgba(82,183,136,0.3);
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }

    /* Listing image */
    .ma-listing-img-wrap {
      position: relative;
      height: 180px;
      background: #1a1f2e;
      overflow: hidden;
    }
    .ma-listing-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }
    .ma-listing-card:hover .ma-listing-img { transform: scale(1.03); }
    .ma-listing-img-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.15);
      font-size: 40px;
      background: linear-gradient(135deg, #1e2638, #252e42);
    }
    .ma-listing-category-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(4px);
      color: #52b788;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
      border: 1px solid rgba(82,183,136,0.3);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Listing body */
    .ma-listing-body {
      padding: 16px 18px 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
    }
    .ma-listing-title {
      color: #ffffff;
      font-size: 15px;
      font-weight: 600;
      margin: 0;
      line-height: 1.4;
    }
    .ma-listing-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .ma-meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
      color: rgba(255,255,255,0.5);
      font-size: 12px;
    }
    .ma-meta-item i { font-size: 11px; }
    .ma-price { color: #52b788 !important; font-weight: 600; }
    .ma-listing-desc {
      color: rgba(255,255,255,0.4);
      font-size: 12px;
      line-height: 1.5;
      margin: 0;
    }

    /* Action buttons */
    .ma-listing-actions {
      display: flex;
      gap: 10px;
      margin-top: 4px;
    }
    .ma-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    .ma-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .ma-btn-approve {
      background: rgba(82,183,136,0.15);
      border-color: rgba(82,183,136,0.4);
      color: #52b788;
      flex: 1;
    }
    .ma-btn-approve:hover:not(:disabled) {
      background: #52b788;
      color: #0d1117;
    }
    .ma-btn-reject {
      background: rgba(220,53,69,0.12);
      border-color: rgba(220,53,69,0.35);
      color: #e06c75;
      flex: 1;
    }
    .ma-btn-reject:hover:not(:disabled) {
      background: rgba(220,53,69,0.25);
      border-color: rgba(220,53,69,0.6);
    }
    .ma-btn-cancel {
      background: rgba(255,255,255,0.06);
      border-color: rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.5);
    }
    .ma-btn-cancel:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }

    /* Rejection form */
    .ma-reject-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 4px;
    }
    .ma-reject-label {
      font-size: 12px;
      color: rgba(255,255,255,0.45);
      font-weight: 500;
    }
    .ma-reject-input {
      background: #1a1f2e;
      border: 1px solid rgba(220,53,69,0.3);
      border-radius: 8px;
      color: #ffffff;
      font-size: 13px;
      padding: 10px 12px;
      resize: vertical;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    .ma-reject-input:focus {
      outline: none;
      border-color: rgba(220,53,69,0.6);
      background: #1e2435;
    }
    .ma-reject-input::placeholder { color: rgba(255,255,255,0.25); }
    .ma-reject-btns {
      display: flex;
      gap: 8px;
    }

    /* ── Orders Table ── */
    .ma-table-wrap {
      background: #232a3b;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      overflow: hidden;
    }
    .ma-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .ma-table thead {
      background: rgba(255,255,255,0.04);
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .ma-table th {
      padding: 13px 14px;
      text-align: left;
      color: rgba(255,255,255,0.45);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      white-space: nowrap;
    }
    .ma-table td {
      padding: 13px 14px;
      color: rgba(255,255,255,0.8);
      border-bottom: 1px solid rgba(255,255,255,0.05);
      vertical-align: middle;
    }
    .ma-table tbody tr:last-child td { border-bottom: none; }
    .ma-table tbody tr:hover td { background: rgba(255,255,255,0.03); }

    .ma-td-id { color: rgba(255,255,255,0.35); font-family: 'DM Mono', monospace; font-size: 12px; }
    .ma-td-listing { font-weight: 500; color: #ffffff; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ma-td-num { text-align: right; font-family: 'DM Mono', monospace; }
    .ma-td-date { color: rgba(255,255,255,0.4); font-size: 12px; white-space: nowrap; }

    .ma-user-cell { display: flex; flex-direction: column; gap: 2px; }
    .ma-cell-email { color: rgba(255,255,255,0.3); font-size: 11px; }

    /* Status / Payment badges */
    .ma-status-badge, .ma-payment-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .ma-status-pending    { background: rgba(255,193,7,0.15);  color: #ffc107; border: 1px solid rgba(255,193,7,0.3); }
    .ma-status-completed  { background: rgba(82,183,136,0.15); color: #52b788; border: 1px solid rgba(82,183,136,0.3); }
    .ma-status-cancelled  { background: rgba(220,53,69,0.12);  color: #e06c75; border: 1px solid rgba(220,53,69,0.25); }
    .ma-status-confirmed  { background: rgba(100,149,237,0.15); color: #6495ed; border: 1px solid rgba(100,149,237,0.3); }
    .ma-status-shipped    { background: rgba(147,112,219,0.15); color: #c3a6ff; border: 1px solid rgba(147,112,219,0.3); }
    .ma-status-unknown    { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.1); }

    .ma-pay-wallet  { background: rgba(82,183,136,0.12); color: #52b788; border: 1px solid rgba(82,183,136,0.25); }
    .ma-pay-card    { background: rgba(100,149,237,0.12); color: #6495ed; border: 1px solid rgba(100,149,237,0.25); }
    .ma-pay-cash    { background: rgba(255,193,7,0.12);   color: #ffc107; border: 1px solid rgba(255,193,7,0.25); }
    .ma-pay-unknown { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.35); border: 1px solid rgba(255,255,255,0.1); }

    /* ── KPI Cards (Overview) ── */
    .ma-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 18px;
    }
    .ma-kpi-card {
      background: #232a3b;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 22px 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .ma-kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(0,0,0,0.25);
    }
    .ma-kpi-icon {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .ma-kpi-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ma-kpi-label {
      color: rgba(255,255,255,0.45);
      font-size: 12px;
      font-weight: 500;
    }
    .ma-kpi-val {
      color: #ffffff;
      font-size: 26px;
      font-weight: 700;
      line-height: 1;
    }
    .ma-kpi-val small {
      font-size: 13px;
      font-weight: 400;
      color: rgba(255,255,255,0.45);
      margin-left: 3px;
    }

    .ma-kpi-blue   .ma-kpi-icon { background: rgba(100,149,237,0.15); color: #6495ed; }
    .ma-kpi-orange .ma-kpi-icon { background: rgba(255,159,64,0.15);   color: #ff9f40; }
    .ma-kpi-green  .ma-kpi-icon { background: rgba(82,183,136,0.15);   color: #52b788; }
    .ma-kpi-teal   .ma-kpi-icon { background: rgba(32,178,170,0.15);   color: #20b2aa; }
    .ma-kpi-emerald .ma-kpi-icon { background: rgba(46,213,115,0.15);  color: #2ed573; }
    .ma-kpi-gold   .ma-kpi-icon { background: rgba(255,215,0,0.12);    color: #ffd700; }

    .ma-kpi-blue   { border-left: 3px solid #6495ed; }
    .ma-kpi-orange { border-left: 3px solid #ff9f40; }
    .ma-kpi-green  { border-left: 3px solid #52b788; }
    .ma-kpi-teal   { border-left: 3px solid #20b2aa; }
    .ma-kpi-emerald { border-left: 3px solid #2ed573; }
    .ma-kpi-gold   { border-left: 3px solid #ffd700; }
  `]
})
export class MarketplaceAdminComponent implements OnInit {
  private svc = inject(MarketplaceService);

  overview   = signal<any>(null);
  pending    = signal<any[]>([]);
  orders     = signal<any[]>([]);
  tab        = signal<'pending' | 'orders' | 'overview'>('pending');
  loading    = signal(false);
  rejectNote = signal('');
  actionId   = signal<number | null>(null);

  // Two-way binding helper for the reject note textarea
  get rejectNoteModel(): string { return this.rejectNote(); }
  set rejectNoteModel(v: string) { this.rejectNote.set(v); }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);

    let done = 0;
    const finish = () => { if (++done === 3) this.loading.set(false); };

    this.svc.adminOverview().subscribe({
      next: (d) => { this.overview.set(d); finish(); },
      error: () => finish()
    });

    this.svc.getPending().subscribe({
      next: (d) => { this.pending.set(d); finish(); },
      error: () => finish()
    });

    this.svc.adminAllOrders().subscribe({
      next: (d) => { this.orders.set(d); finish(); },
      error: () => finish()
    });
  }

  approve(id: number): void {
    this.loading.set(true);
    this.svc.approveListing(id, '').subscribe({
      next: () => this.refreshPending(),
      error: () => this.loading.set(false)
    });
  }

  startReject(id: number): void {
    this.rejectNote.set('');
    this.actionId.set(id);
  }

  confirmReject(id: number): void {
    this.loading.set(true);
    this.svc.rejectListing(id, this.rejectNote()).subscribe({
      next: () => {
        this.actionId.set(null);
        this.refreshPending();
      },
      error: () => this.loading.set(false)
    });
  }

  cancelAction(): void {
    this.actionId.set(null);
    this.rejectNote.set('');
  }

  private refreshPending(): void {
    this.svc.getPending().subscribe({
      next: (d) => { this.pending.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const placeholder = img.nextElementSibling as HTMLElement;
    if (placeholder) placeholder.style.display = 'flex';
  }
}

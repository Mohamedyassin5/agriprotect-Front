import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-wallet-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wa-page">

      <!-- ── Page Header ── -->
      <div class="wa-page-header">
        <div>
          <h4 class="wa-page-title">
            <i class="feather icon-credit-card"></i>
            Wallet Admin
          </h4>
          <p class="wa-page-sub">Gestion des portefeuilles et retraits d'urgence</p>
        </div>
        <button class="wa-refresh-btn" (click)="loadAll()" [disabled]="loading()">
          <i class="feather icon-refresh-cw" [class.wa-spinning]="loading()"></i>
          Actualiser
        </button>
      </div>

      <!-- ── Loading ── -->
      <div *ngIf="loading()" class="wa-loading">
        <div class="wa-spinner"></div>
        <p>Chargement des données...</p>
      </div>

      <!-- ── Tabs ── -->
      <div class="wa-tabs">
        <button class="wa-tab" [class.wa-tab--active]="tab() === 'pending'" (click)="tab.set('pending')">
          <i class="feather icon-alert-circle"></i>
          Retraits en attente
          <span class="wa-tab-badge" *ngIf="pendingWithdrawals().length > 0">{{ pendingWithdrawals().length }}</span>
        </button>
        <button class="wa-tab" [class.wa-tab--active]="tab() === 'overview'" (click)="tab.set('overview')">
          <i class="feather icon-bar-chart-2"></i>
          Aperçu
        </button>
      </div>

      <!-- ════════════ TAB: RETRAITS EN ATTENTE ════════════ -->
      <div *ngIf="tab() === 'pending' && !loading()">
        <div *ngIf="pendingWithdrawals().length === 0" class="wa-empty">
          <i class="feather icon-check-circle"></i>
          <p>Aucune demande de retrait d'urgence en attente.</p>
        </div>

        <div class="wa-withdrawals-list" *ngIf="pendingWithdrawals().length > 0">
          <div class="wa-withdrawal-card" *ngFor="let req of pendingWithdrawals()">
            <!-- Card Header -->
            <div class="wa-card-header">
              <div class="wa-farmer-info">
                <div class="wa-avatar">{{ getInitials(req) }}</div>
                <div>
                  <div class="wa-farmer-name">
                    {{ req.walletUserName || 'Agriculteur' }}
                  </div>
                  <div class="wa-farmer-email">
                    {{ req.walletUserEmail || '' }}
                  </div>
                </div>
              </div>
              <div class="wa-amount-badge">
                <span class="wa-amount">{{ req.amount | number:'1.2-2' }} DT</span>
                <span class="wa-status-chip" [class]="'wa-status-' + (req.status || 'pending')?.toLowerCase()">
                  {{ req.status || 'PENDING' }}
                </span>
              </div>
            </div>

            <!-- Card Body -->
            <div class="wa-card-body">
              <div class="wa-info-row">
                <div class="wa-info-item">
                  <span class="wa-info-label"><i class="feather icon-alert-triangle"></i> Motif</span>
                  <span class="wa-info-value wa-reason">{{ req.reason || '—' }}</span>
                </div>
                <div class="wa-info-item" *ngIf="req.requestDate || req.createdAt">
                  <span class="wa-info-label"><i class="feather icon-calendar"></i> Date de demande</span>
                  <span class="wa-info-value">{{ (req.requestDate || req.createdAt) | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
              <div class="wa-description" *ngIf="req.description">
                <span class="wa-desc-label">Description</span>
                <p class="wa-desc-text">{{ req.description }}</p>
              </div>
            </div>

            <!-- Action Zone -->
            <div class="wa-card-actions" *ngIf="actionId() !== req.id">
              <button class="wa-btn wa-btn-approve" (click)="startAction(req.id, 'approve')" [disabled]="loading()">
                <i class="feather icon-check-circle"></i> Approuver
              </button>
              <button class="wa-btn wa-btn-reject" (click)="startAction(req.id, 'reject')" [disabled]="loading()">
                <i class="feather icon-x-circle"></i> Rejeter
              </button>
            </div>

            <!-- Inline confirm form -->
            <div class="wa-confirm-form" *ngIf="actionId() === req.id">
              <div class="wa-confirm-header" [class.wa-confirm-approve]="actionType() === 'approve'" [class.wa-confirm-reject]="actionType() === 'reject'">
                <i class="feather" [class.icon-check-circle]="actionType() === 'approve'" [class.icon-x-circle]="actionType() === 'reject'"></i>
                {{ actionType() === 'approve' ? "Confirmer l'approbation" : 'Confirmer le rejet' }}
              </div>
              <textarea
                class="wa-note-input"
                [(ngModel)]="adminNoteModel"
                [placeholder]="actionType() === 'approve' ? 'Note administrative (optionnel)...' : 'Motif du rejet (recommandé)...'"
                rows="3"
              ></textarea>
              <div class="wa-confirm-btns">
                <button
                  class="wa-btn"
                  [class.wa-btn-approve]="actionType() === 'approve'"
                  [class.wa-btn-reject]="actionType() === 'reject'"
                  (click)="confirmAction(req.id)"
                  [disabled]="loading()"
                >
                  <i class="feather" [class.icon-check]="actionType() === 'approve'" [class.icon-x]="actionType() === 'reject'"></i>
                  {{ actionType() === 'approve' ? "Confirmer l'approbation" : 'Confirmer le rejet' }}
                </button>
                <button class="wa-btn wa-btn-cancel" (click)="cancelAction()">
                  Annuler
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- ════════════ TAB: APERÇU ════════════ -->
      <div *ngIf="tab() === 'overview' && !loading()">
        <div *ngIf="!overview()" class="wa-empty">
          <i class="feather icon-bar-chart-2"></i>
          <p>Données d'aperçu indisponibles.</p>
        </div>

        <div class="wa-kpi-grid" *ngIf="overview()">
          <div class="wa-kpi-card wa-kpi-blue">
            <div class="wa-kpi-icon"><i class="feather icon-credit-card"></i></div>
            <div class="wa-kpi-body">
              <span class="wa-kpi-label">Total Portefeuilles</span>
              <span class="wa-kpi-val">{{ overview()?.totalWallets ?? 0 }}</span>
              <span class="wa-kpi-hint">comptes actifs</span>
            </div>
          </div>
          <div class="wa-kpi-card wa-kpi-green">
            <div class="wa-kpi-icon"><i class="feather icon-dollar-sign"></i></div>
            <div class="wa-kpi-body">
              <span class="wa-kpi-label">Solde Disponible Total</span>
              <span class="wa-kpi-val">{{ (overview()?.totalPlatformBalance ?? 0) | number:'1.0-0' }} <small>DT</small></span>
              <span class="wa-kpi-hint">solde total plateforme</span>
            </div>
          </div>
          <div class="wa-kpi-card wa-kpi-teal">
            <div class="wa-kpi-icon"><i class="feather icon-shield"></i></div>
            <div class="wa-kpi-body">
              <span class="wa-kpi-label">Fonds d'Urgence Totaux</span>
              <span class="wa-kpi-val">{{ (overview()?.totalEmergencyFunds ?? 0) | number:'1.0-0' }} <small>DT</small></span>
              <span class="wa-kpi-hint">réserves d'urgence</span>
            </div>
          </div>
          <div class="wa-kpi-card wa-kpi-orange">
            <div class="wa-kpi-icon"><i class="feather icon-clock"></i></div>
            <div class="wa-kpi-body">
              <span class="wa-kpi-label">Retraits en Attente</span>
              <span class="wa-kpi-val wa-val-warning">{{ overview()?.pendingWithdrawals ?? pendingWithdrawals().length }}</span>
              <span class="wa-kpi-hint">demandes à traiter</span>
            </div>
          </div>
        </div>

        <!-- Additional overview stats if available -->
        <div class="wa-stats-extra" *ngIf="overview()">
          <div class="wa-extra-row" *ngIf="overview()?.totalDeposits != null">
            <span class="wa-extra-label"><i class="feather icon-arrow-down-circle"></i> Total Dépôts</span>
            <span class="wa-extra-val">{{ overview()?.totalDeposits | number:'1.0-0' }} DT</span>
          </div>
          <div class="wa-extra-row" *ngIf="overview()?.totalWithdrawals != null">
            <span class="wa-extra-label"><i class="feather icon-arrow-up-circle"></i> Total Retraits</span>
            <span class="wa-extra-val">{{ overview()?.totalWithdrawals | number:'1.0-0' }} DT</span>
          </div>
          <div class="wa-extra-row" *ngIf="overview()?.averageBalance != null">
            <span class="wa-extra-label"><i class="feather icon-activity"></i> Solde Moyen</span>
            <span class="wa-extra-val">{{ overview()?.averageBalance | number:'1.2-2' }} DT</span>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    /* ── Layout ── */
    .wa-page {
      background: #1a1f2e;
      min-height: 100vh;
      padding: 28px 32px;
      color: #ffffff;
      font-family: 'Inter', 'DM Sans', sans-serif;
    }

    /* ── Header ── */
    .wa-page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 28px;
    }
    .wa-page-title {
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 6px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .wa-page-title i {
      color: #52b788;
      font-size: 20px;
    }
    .wa-page-sub {
      color: rgba(255,255,255,0.45);
      font-size: 13px;
      margin: 0;
    }
    .wa-refresh-btn {
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
    .wa-refresh-btn:hover:not(:disabled) {
      background: rgba(82,183,136,0.25);
      border-color: rgba(82,183,136,0.5);
    }
    .wa-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Loading ── */
    .wa-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: rgba(255,255,255,0.45);
      gap: 14px;
    }
    .wa-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(82,183,136,0.2);
      border-top-color: #52b788;
      border-radius: 50%;
      animation: wa-spin 0.8s linear infinite;
    }
    @keyframes wa-spin { to { transform: rotate(360deg); } }
    @keyframes wa-spin-icon { to { transform: rotate(360deg); } }
    .wa-spinning { animation: wa-spin-icon 0.8s linear infinite; display: inline-block; }

    /* ── Tabs ── */
    .wa-tabs {
      display: flex;
      gap: 4px;
      background: #232a3b;
      border-radius: 12px;
      padding: 6px;
      margin-bottom: 24px;
      border: 1px solid rgba(255,255,255,0.06);
      width: fit-content;
    }
    .wa-tab {
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
    .wa-tab:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.05); }
    .wa-tab--active {
      background: #52b788 !important;
      color: #0d1117 !important;
      font-weight: 600;
    }
    .wa-tab-badge {
      background: rgba(0,0,0,0.25);
      color: inherit;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 10px;
      min-width: 20px;
      text-align: center;
    }
    .wa-tab--active .wa-tab-badge { background: rgba(0,0,0,0.2); }

    /* ── Empty state ── */
    .wa-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      color: rgba(255,255,255,0.3);
      gap: 12px;
    }
    .wa-empty i { font-size: 48px; }
    .wa-empty p { font-size: 14px; margin: 0; }

    /* ── Withdrawal Cards ── */
    .wa-withdrawals-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .wa-withdrawal-card {
      background: #232a3b;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      overflow: hidden;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .wa-withdrawal-card:hover {
      border-color: rgba(82,183,136,0.2);
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }

    /* Card header */
    .wa-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 20px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .wa-farmer-info {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .wa-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2d6a4f, #52b788);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      flex-shrink: 0;
      text-transform: uppercase;
    }
    .wa-farmer-name {
      color: #ffffff;
      font-weight: 600;
      font-size: 14px;
    }
    .wa-farmer-email {
      color: rgba(255,255,255,0.4);
      font-size: 12px;
      margin-top: 2px;
    }
    .wa-amount-badge {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }
    .wa-amount {
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      font-family: 'DM Mono', monospace;
    }

    /* Status chips */
    .wa-status-chip {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }
    .wa-status-pending  { background: rgba(255,193,7,0.15);  color: #ffc107; border: 1px solid rgba(255,193,7,0.3); }
    .wa-status-approved { background: rgba(82,183,136,0.15); color: #52b788; border: 1px solid rgba(82,183,136,0.3); }
    .wa-status-rejected { background: rgba(220,53,69,0.12);  color: #e06c75; border: 1px solid rgba(220,53,69,0.25); }

    /* Card body */
    .wa-card-body {
      padding: 16px 20px;
    }
    .wa-info-row {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 12px;
    }
    .wa-info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 160px;
    }
    .wa-info-label {
      color: rgba(255,255,255,0.35);
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .wa-info-label i { font-size: 10px; }
    .wa-info-value {
      color: rgba(255,255,255,0.8);
      font-size: 13px;
      font-weight: 500;
    }
    .wa-reason {
      color: #ffc107 !important;
      font-weight: 600;
    }
    .wa-description { margin-top: 4px; }
    .wa-desc-label {
      color: rgba(255,255,255,0.35);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      display: block;
      margin-bottom: 6px;
    }
    .wa-desc-text {
      color: rgba(255,255,255,0.6);
      font-size: 13px;
      line-height: 1.55;
      margin: 0;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 8px;
      padding: 10px 14px;
    }

    /* Card actions */
    .wa-card-actions {
      display: flex;
      gap: 10px;
      padding: 14px 20px 18px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .wa-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    .wa-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .wa-btn-approve {
      background: rgba(82,183,136,0.15);
      border-color: rgba(82,183,136,0.4);
      color: #52b788;
    }
    .wa-btn-approve:hover:not(:disabled) {
      background: #52b788;
      color: #0d1117;
      border-color: #52b788;
    }
    .wa-btn-reject {
      background: rgba(220,53,69,0.12);
      border-color: rgba(220,53,69,0.35);
      color: #e06c75;
    }
    .wa-btn-reject:hover:not(:disabled) {
      background: rgba(220,53,69,0.25);
      border-color: rgba(220,53,69,0.6);
    }
    .wa-btn-cancel {
      background: rgba(255,255,255,0.06);
      border-color: rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.5);
    }
    .wa-btn-cancel:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }

    /* Confirm form */
    .wa-confirm-form {
      border-top: 1px solid rgba(255,255,255,0.06);
      padding: 16px 20px 18px;
    }
    .wa-confirm-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 12px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .wa-confirm-approve {
      background: rgba(82,183,136,0.1);
      border: 1px solid rgba(82,183,136,0.25);
      color: #52b788;
    }
    .wa-confirm-reject {
      background: rgba(220,53,69,0.1);
      border: 1px solid rgba(220,53,69,0.25);
      color: #e06c75;
    }
    .wa-note-input {
      width: 100%;
      background: #1a1f2e;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: #ffffff;
      font-size: 13px;
      padding: 10px 12px;
      resize: vertical;
      font-family: inherit;
      box-sizing: border-box;
      transition: border-color 0.2s;
      margin-bottom: 12px;
    }
    .wa-note-input:focus {
      outline: none;
      border-color: rgba(82,183,136,0.4);
      background: #1e2435;
    }
    .wa-note-input::placeholder { color: rgba(255,255,255,0.25); }
    .wa-confirm-btns {
      display: flex;
      gap: 10px;
    }

    /* ── KPI Cards (Overview) ── */
    .wa-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 18px;
      margin-bottom: 24px;
    }
    .wa-kpi-card {
      background: #232a3b;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 22px 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .wa-kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(0,0,0,0.25);
    }
    .wa-kpi-icon {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .wa-kpi-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .wa-kpi-label {
      color: rgba(255,255,255,0.45);
      font-size: 12px;
      font-weight: 500;
    }
    .wa-kpi-val {
      color: #ffffff;
      font-size: 26px;
      font-weight: 700;
      line-height: 1;
    }
    .wa-kpi-val small {
      font-size: 13px;
      font-weight: 400;
      color: rgba(255,255,255,0.45);
      margin-left: 3px;
    }
    .wa-val-warning { color: #ffc107 !important; }
    .wa-kpi-hint {
      color: rgba(255,255,255,0.3);
      font-size: 11px;
    }

    .wa-kpi-blue   .wa-kpi-icon { background: rgba(100,149,237,0.15); color: #6495ed; }
    .wa-kpi-green  .wa-kpi-icon { background: rgba(82,183,136,0.15);  color: #52b788; }
    .wa-kpi-teal   .wa-kpi-icon { background: rgba(32,178,170,0.15);  color: #20b2aa; }
    .wa-kpi-orange .wa-kpi-icon { background: rgba(255,159,64,0.15);  color: #ff9f40; }

    .wa-kpi-blue   { border-left: 3px solid #6495ed; }
    .wa-kpi-green  { border-left: 3px solid #52b788; }
    .wa-kpi-teal   { border-left: 3px solid #20b2aa; }
    .wa-kpi-orange { border-left: 3px solid #ff9f40; }

    /* Extra stats rows */
    .wa-stats-extra {
      background: #232a3b;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      overflow: hidden;
    }
    .wa-extra-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .wa-extra-row:last-child { border-bottom: none; }
    .wa-extra-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: rgba(255,255,255,0.5);
      font-size: 13px;
    }
    .wa-extra-label i { font-size: 14px; color: #52b788; }
    .wa-extra-val {
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      font-family: 'DM Mono', monospace;
    }
  `]
})
export class WalletAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly BASE = 'http://localhost:8085/api/admin/wallet';

  overview           = signal<any>(null);
  pendingWithdrawals = signal<any[]>([]);
  tab                = signal<'pending' | 'overview'>('pending');
  loading            = signal(false);
  adminNote          = signal('');
  actionId           = signal<number | null>(null);
  actionType         = signal<'approve' | 'reject' | null>(null);

  // Two-way binding helper for the admin note textarea
  get adminNoteModel(): string { return this.adminNote(); }
  set adminNoteModel(v: string) { this.adminNote.set(v); }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);

    let done = 0;
    const finish = () => { if (++done === 2) this.loading.set(false); };

    this.http.get<any>(`${this.BASE}/overview`).subscribe({
      next: (d) => { this.overview.set(d); finish(); },
      error: () => finish()
    });

    this.http.get<any[]>(`${this.BASE}/emergency/pending`).subscribe({
      next: (d) => { this.pendingWithdrawals.set(d ?? []); finish(); },
      error: () => finish()
    });
  }

  startAction(id: number, type: 'approve' | 'reject'): void {
    this.adminNote.set('');
    this.actionId.set(id);
    this.actionType.set(type);
  }

  confirmAction(id: number): void {
    const type = this.actionType();
    if (!type) return;

    this.loading.set(true);
    const note = this.adminNote();
    const url  = `${this.BASE}/emergency/${id}/${type}`;

    this.http.post<any>(url, null, { params: { adminNote: note } }).subscribe({
      next: () => {
        this.actionId.set(null);
        this.actionType.set(null);
        this.refreshPending();
      },
      error: () => this.loading.set(false)
    });
  }

  cancelAction(): void {
    this.actionId.set(null);
    this.actionType.set(null);
    this.adminNote.set('');
  }

  private refreshPending(): void {
    this.http.get<any[]>(`${this.BASE}/emergency/pending`).subscribe({
      next: (d) => { this.pendingWithdrawals.set(d ?? []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  getInitials(req: any): string {
    const name: string = (req.walletUserName || '').trim();
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map((w: string) => w[0] ?? '').join('').toUpperCase();
  }
}

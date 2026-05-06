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
      background: #f4f7f6;
      min-height: 100vh;
      padding: 28px 32px;
      color: #1b4332;
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
      color: #1b4332;
      font-size: 24px;
      font-weight: 800;
      margin: 0 0 6px 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .wa-page-title i {
      color: #2d6a4f;
      font-size: 22px;
    }
    .wa-page-sub {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
      font-weight: 500;
    }
    .wa-refresh-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      color: #2d6a4f;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .wa-refresh-btn:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #2d6a4f;
      transform: translateY(-1px);
    }
    .wa-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Loading ── */
    .wa-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #6b7280;
      gap: 14px;
    }
    .wa-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e5e7eb;
      border-top-color: #2d6a4f;
      border-radius: 50%;
      animation: wa-spin 0.8s linear infinite;
    }
    @keyframes wa-spin { to { transform: rotate(360deg); } }
    @keyframes wa-spin-icon { to { transform: rotate(360deg); } }
    .wa-spinning { animation: wa-spin-icon 0.8s linear infinite; display: inline-block; }

    /* ── Tabs ── */
    .wa-tabs {
      display: flex;
      gap: 8px;
      background: #ffffff;
      border-radius: 14px;
      padding: 6px;
      margin-bottom: 28px;
      border: 1px solid #e5e7eb;
      width: fit-content;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    }
    .wa-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      border: none;
      color: #6b7280;
      padding: 10px 22px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .wa-tab:hover { color: #1b4332; background: #f3f4f6; }
    .wa-tab--active {
      background: #2d6a4f !important;
      color: #ffffff !important;
    }
    .wa-tab-badge {
      background: rgba(255,255,255,0.25);
      color: inherit;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
      min-width: 22px;
      text-align: center;
    }
    .wa-tab--active .wa-tab-badge { background: rgba(0,0,0,0.15); }

    /* ── Empty state ── */
    .wa-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      color: #9ca3af;
      gap: 12px;
    }
    .wa-empty i { font-size: 56px; color: #e5e7eb; }
    .wa-empty p { font-size: 15px; margin: 0; font-weight: 500; }

    /* ── Withdrawal Cards ── */
    .wa-withdrawals-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .wa-withdrawal-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 18px;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .wa-withdrawal-card:hover {
      border-color: #2d6a4f;
      box-shadow: 0 12px 24px -8px rgba(45, 106, 79, 0.15);
      transform: translateY(-2px);
    }

    /* Card header */
    .wa-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      background: #fcfdfc;
      border-bottom: 1px solid #f0f2f0;
    }
    .wa-farmer-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .wa-avatar {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: #1b4332;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      flex-shrink: 0;
      text-transform: uppercase;
      box-shadow: 0 4px 10px rgba(27, 67, 50, 0.2);
    }
    .wa-farmer-name {
      color: #111827;
      font-weight: 700;
      font-size: 16px;
    }
    .wa-farmer-email {
      color: #6b7280;
      font-size: 13px;
      margin-top: 2px;
    }
    .wa-amount-badge {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    .wa-amount {
      color: #111827;
      font-size: 24px;
      font-weight: 800;
      font-family: 'DM Mono', monospace;
    }

    /* Status chips */
    .wa-status-chip {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .wa-status-pending  { background: #fef9c3; color: #854d0e; border: 1px solid #fde68a; }
    .wa-status-approved { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .wa-status-rejected { background: #fee2e2; color: #991b1b; border: 1px solid #fecdd3; }

    /* Card body */
    .wa-card-body {
      padding: 20px 24px;
    }
    .wa-info-row {
      display: flex;
      flex-wrap: wrap;
      gap: 32px;
      margin-bottom: 16px;
    }
    .wa-info-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .wa-info-label {
      color: #9ca3af;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .wa-info-value {
      color: #374151;
      font-size: 14px;
      font-weight: 600;
    }
    .wa-reason {
      color: #b45309 !important;
      font-weight: 800;
    }
    .wa-description { margin-top: 8px; }
    .wa-desc-label {
      color: #9ca3af;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      display: block;
      margin-bottom: 8px;
    }
    .wa-desc-text {
      color: #4b5563;
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 12px;
      padding: 14px 18px;
    }

    /* Card actions */
    .wa-card-actions {
      display: flex;
      gap: 12px;
      padding: 16px 24px 24px;
    }
    .wa-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 22px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    .wa-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .wa-btn-approve {
      background: #2d6a4f;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(45, 106, 79, 0.2);
    }
    .wa-btn-approve:hover:not(:disabled) {
      background: #1b4332;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(45, 106, 79, 0.3);
    }
    .wa-btn-reject {
      background: #ffffff;
      border-color: #fecdd3;
      color: #dc2626;
    }
    .wa-btn-reject:hover:not(:disabled) {
      background: #fff1f2;
      border-color: #dc2626;
    }
    .wa-btn-cancel {
      background: #f3f4f6;
      color: #6b7280;
    }
    .wa-btn-cancel:hover { background: #e5e7eb; color: #374151; }

    /* Confirm form */
    .wa-confirm-form {
      padding: 16px 24px 24px;
      background: #fffafb;
      border-top: 1px solid #fef2f2;
    }
    .wa-confirm-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 700;
      padding: 10px 14px;
      border-radius: 10px;
      margin-bottom: 14px;
    }
    .wa-confirm-approve {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .wa-confirm-reject {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecdd3;
    }
    .wa-note-input {
      width: 100%;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      color: #111827;
      font-size: 14px;
      padding: 12px 16px;
      resize: vertical;
      font-family: inherit;
      box-sizing: border-box;
      transition: all 0.2s;
      margin-bottom: 14px;
    }
    .wa-note-input:focus {
      outline: none;
      border-color: #2d6a4f;
      box-shadow: 0 0 0 4px rgba(45, 106, 79, 0.1);
    }

    /* ── KPI Cards (Overview) ── */
    .wa-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }
    .wa-kpi-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      transition: all 0.3s var(--ease-cinematic);
    }
    .wa-kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.06);
    }
    .wa-kpi-icon {
      width: 54px;
      height: 54px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }
    .wa-kpi-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .wa-kpi-label {
      color: #6b7280;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .wa-kpi-val {
      color: #111827;
      font-size: 28px;
      font-weight: 800;
      line-height: 1;
    }
    .wa-kpi-val small {
      font-size: 14px;
      font-weight: 500;
      color: #9ca3af;
      margin-left: 4px;
    }
    .wa-val-warning { color: #b45309 !important; }

    .wa-kpi-blue   .wa-kpi-icon { background: #eff6ff; color: #2563eb; }
    .wa-kpi-green  .wa-kpi-icon { background: #f0fdf4; color: #166534; }
    .wa-kpi-teal   .wa-kpi-icon { background: #f0fdfa; color: #0d9488; }
    .wa-kpi-orange .wa-kpi-icon { background: #fffbeb; color: #b45309; }

    /* Extra stats rows */
    .wa-stats-extra {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .wa-extra-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid #f3f4f6;
    }
    .wa-extra-row:last-child { border-bottom: none; }
    .wa-extra-label {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #4b5563;
      font-size: 14px;
      font-weight: 500;
    }
    .wa-extra-label i { font-size: 16px; color: #2d6a4f; }
    .wa-extra-val {
      color: #111827;
      font-size: 15px;
      font-weight: 700;
      font-family: 'DM Mono', monospace;
    }

  `]
})
export class WalletAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly BASE = 'http://localhost:8081/api/admin/wallet';

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

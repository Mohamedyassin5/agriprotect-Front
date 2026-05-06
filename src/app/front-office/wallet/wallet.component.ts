import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  WalletService,
  WalletDto,
  WalletTransactionDto,
  EmergencyWithdrawalDto
} from './wallet.service';

type Tab = 'ops' | 'emergency' | 'history' | 'transfer';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="wallet-root">
      <!-- HEADER -->
      <div class="wallet-header">
        <h1 class="wallet-title">E-WALLET</h1>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="clickRecharge()">Recharger</button>
          <button class="btn btn-outline" (click)="clickWithdraw()">Retirer</button>
        </div>
      </div>

      <!-- ALERTS -->
      <div class="alert alert-success" *ngIf="successMsg()">{{ successMsg() }}</div>
      <div class="alert alert-error"   *ngIf="errorMsg()">{{ errorMsg() }}</div>

      <!-- BALANCE CARDS -->
      <div class="cards-row" *ngIf="wallet()">
        <div class="card card-available">
          <p class="card-label">SOLDE DISPONIBLE</p>
          <p class="card-amount">{{ wallet()!.availableBalance | number:'1.2-2' }} TND</p>
          <p class="card-sub">Total: {{ wallet()!.totalBalance | number:'1.2-2' }} TND</p>
        </div>
        <div class="card card-emergency">
          <p class="card-label">FONDS D'URGENCE</p>
          <p class="card-amount">
            {{ wallet()!.emergencyFundBalance | number:'1.2-2' }} /
            {{ wallet()!.emergencyTargetAmount | number:'1.2-2' }} TND
          </p>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" [style.width.%]="clampPct(wallet()!.emergencyProgressPct)"></div>
          </div>
          <p class="progress-label">{{ clampPct(wallet()!.emergencyProgressPct) | number:'1.0-0' }}%</p>
          <span class="resilience-badge" [ngClass]="resilienceClass(wallet()!.emergencyResilienceLevel)">
            Résilience: {{ wallet()!.emergencyResilienceLevel }}
          </span>
        </div>
      </div>

      <div class="cards-row" *ngIf="!wallet() && loading()">
        <p class="loading-text">Chargement du portefeuille…</p>
      </div>

      <!-- TABS -->
      <div class="tabs">
        <button class="tab-btn" [class.active]="activeTab() === 'ops'"
          (click)="setTab('ops')">Opérations</button>
        <button class="tab-btn" [class.active]="activeTab() === 'emergency'"
          (click)="setTab('emergency')">Fonds d'Urgence</button>
        <button class="tab-btn" [class.active]="activeTab() === 'history'"
          (click)="setTab('history')">Historique</button>
        <button class="tab-btn" [class.active]="activeTab() === 'transfer'"
          (click)="setTab('transfer')">Transfert</button>
      </div>

      <!-- TAB: OPERATIONS -->
      <div class="tab-content" *ngIf="activeTab() === 'ops'">
        <div class="form-grid">
          <!-- Deposit -->
          <div class="form-card" #depositCard [class.form-focused]="focusForm() === 'deposit'">
            <h3 class="form-title">Dépôt</h3>
            <div class="form-group">
              <label>Montant (TND)</label>
              <input type="number" min="0" [(ngModel)]="depositAmount" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <input type="text" [(ngModel)]="depositDesc" placeholder="Description…" />
            </div>
            <button class="btn btn-primary btn-full" [disabled]="loading()"
              (click)="onDeposit()">Déposer</button>
          </div>

          <!-- Withdraw -->
          <div class="form-card" #withdrawCard [class.form-focused]="focusForm() === 'withdraw'">
            <h3 class="form-title">Retrait</h3>
            <div class="form-group">
              <label>Montant (TND)</label>
              <input type="number" min="0" [(ngModel)]="withdrawAmount" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <input type="text" [(ngModel)]="withdrawDesc" placeholder="Description…" />
            </div>
            <button class="btn btn-outline btn-full" [disabled]="loading()"
              (click)="onWithdraw()">Retirer</button>
          </div>
        </div>
      </div>

      <!-- TAB: EMERGENCY -->
      <div class="tab-content" *ngIf="activeTab() === 'emergency'">
        <!-- Progress summary -->
        <div class="emergency-summary" *ngIf="wallet()">
          <div class="progress-bar-track large">
            <div class="progress-bar-fill" [style.width.%]="clampPct(wallet()!.emergencyProgressPct)"></div>
          </div>
          <div class="emergency-meta">
            <span>{{ wallet()!.emergencyFundBalance | number:'1.2-2' }} TND
              / {{ wallet()!.emergencyTargetAmount | number:'1.2-2' }} TND</span>
            <span class="resilience-badge" [ngClass]="resilienceClass(wallet()!.emergencyResilienceLevel)">
              {{ wallet()!.emergencyResilienceLevel }}
            </span>
          </div>
        </div>

        <div class="form-grid">
          <!-- Configure -->
          <div class="form-card">
            <h3 class="form-title">Configurer le fonds</h3>
            <div class="form-group">
              <label>Montant cible (TND)</label>
              <input type="number" min="0" [(ngModel)]="cfgTarget" placeholder="5000" />
            </div>
            <div class="form-group toggle-group">
              <label>Contribution auto</label>
              <label class="toggle-switch">
                <input type="checkbox" [(ngModel)]="cfgAutoEnabled" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="form-group" *ngIf="cfgAutoEnabled">
              <label>Contribution mensuelle (TND)</label>
              <input type="number" min="0" [(ngModel)]="cfgAutoPct" placeholder="200" />
            </div>
            <div class="form-group" *ngIf="cfgAutoEnabled">
              <label>Jour de prélèvement (1-28)</label>
              <input type="number" min="1" max="28" [(ngModel)]="cfgContribDay" placeholder="1" />
            </div>
            <button class="btn btn-primary btn-full" [disabled]="loading()"
              (click)="onConfigureEmergency()">Enregistrer</button>
          </div>

          <!-- Manual contribute -->
          <div class="form-card">
            <h3 class="form-title">Contribution manuelle</h3>
            <div class="form-group">
              <label>Montant (TND)</label>
              <input type="number" min="0" [(ngModel)]="contributeAmount" placeholder="0.00" />
            </div>
            <button class="btn btn-primary btn-full" [disabled]="loading()"
              (click)="onContribute()">Contribuer</button>

            <hr class="divider" />

            <h3 class="form-title">Demande de retrait d'urgence</h3>
            <div class="form-group">
              <label>Montant (TND)</label>
              <input type="number" min="0" [(ngModel)]="ewAmount" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label>Motif</label>
              <select [(ngModel)]="ewReason">
                <option value="">-- Sélectionner --</option>
                <option value="MEDICAL">Médical / Santé</option>
                <option value="WEATHER_DISASTER">Catastrophe naturelle / Intempéries</option>
                <option value="CROP_DAMAGE">Perte / Dégâts de récolte</option>
                <option value="EQUIPMENT_FAILURE">Panne d'équipement</option>
                <option value="PEST_OUTBREAK">Invasion de ravageurs</option>
                <option value="FLOOD">Inondation</option>
                <option value="DROUGHT">Sécheresse</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="ewDesc" rows="2" placeholder="Détails…"></textarea>
            </div>
            <button class="btn btn-danger btn-full" [disabled]="loading()"
              (click)="onRequestWithdrawal()">Soumettre la demande</button>
          </div>
        </div>

        <!-- Withdrawal requests list -->
        <div class="section-title" *ngIf="withdrawals().length > 0">Mes demandes de retrait</div>
        <div class="withdrawals-list" *ngIf="withdrawals().length > 0">
          <div class="withdrawal-item" *ngFor="let w of withdrawals()">
            <div class="withdrawal-header">
              <span class="withdrawal-amount">{{ w.amount | number:'1.2-2' }} TND</span>
              <span class="status-badge" [ngClass]="statusClass(w.status)">{{ w.status }}</span>
            </div>
            <p class="withdrawal-reason">{{ w.reason }} — {{ w.description }}</p>
            <p class="withdrawal-date">{{ w.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
            <p class="withdrawal-note" *ngIf="w.adminNote">Note admin: {{ w.adminNote }}</p>
          </div>
        </div>
        <p class="empty-text" *ngIf="withdrawals().length === 0">Aucune demande de retrait.</p>
      </div>

      <!-- TAB: HISTORY -->
      <div class="tab-content" *ngIf="activeTab() === 'history'">
        <div class="table-wrapper" *ngIf="transactions().length > 0">
          <table class="tx-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Montant</th>
                <th>Description</th>
                <th>Avant</th>
                <th>Après</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of transactions()">
                <td><span class="tx-type" [ngClass]="txTypeClass(tx.type)">{{ tx.type }}</span></td>
                <td class="tx-amount" [ngClass]="tx.amount >= 0 ? 'positive' : 'negative'">
                  {{ tx.amount | number:'1.2-2' }} TND
                </td>
                <td>{{ tx.description }}</td>
                <td>{{ tx.balanceBefore | number:'1.2-2' }}</td>
                <td>{{ tx.balanceAfter | number:'1.2-2' }}</td>
                <td>{{ tx.createdAt | date:'dd/MM/yy HH:mm' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="empty-text" *ngIf="transactions().length === 0 && !loading()">Aucune transaction.</p>
        <div class="load-more-row">
          <button class="btn btn-outline" [disabled]="loading()" (click)="loadMore()">
            Charger plus
          </button>
        </div>
      </div>

      <!-- TAB: TRANSFER -->
      <div class="tab-content" *ngIf="activeTab() === 'transfer'">
        <div class="form-card form-card-centered">
          <h3 class="form-title">Virement entre comptes</h3>
          <div class="form-group">
            <label>Email du destinataire</label>
            <input type="email" [(ngModel)]="transferEmail" placeholder="destinataire@email.com" />
          </div>
          <div class="form-group">
            <label>Montant (TND)</label>
            <input type="number" min="0" [(ngModel)]="transferAmount" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <input type="text" [(ngModel)]="transferDesc" placeholder="Description…" />
          </div>
          <button class="btn btn-primary btn-full" [disabled]="loading()"
            (click)="onTransfer()">Envoyer</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --clr-bg: #f4f7f4;
      --clr-primary: #52b788;
      --clr-primary-dark: #40916c;
      --clr-available-from: #1a472a;
      --clr-available-to: #2d6a4f;
      --clr-emergency-from: #1b4332;
      --clr-emergency-to: #40916c;
      --clr-text: #1c1c1e;
      --clr-muted: #6b7280;
      --clr-border: #d1fae5;
      --clr-danger: #ef4444;
      --clr-warn: #f59e0b;
      --clr-info: #3b82f6;
      --clr-success: #10b981;
      --radius: 12px;
      --shadow: 0 2px 12px rgba(0,0,0,.08);
      display: block;
      background: var(--clr-bg);
      min-height: 100vh;
      padding: 24px;
      font-family: 'Inter', sans-serif;
    }

    .wallet-root { max-width: 1100px; margin: 0 auto; }

    /* HEADER */
    .wallet-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 24px;
    }
    .wallet-title { font-size: 1.6rem; font-weight: 700; color: var(--clr-available-from); margin: 0; }
    .header-actions { display: flex; gap: 10px; }

    /* ALERTS */
    .alert { padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; font-size: .9rem; }
    .alert-success { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .alert-error   { background: #fee2e2; color: #7f1d1d; border: 1px solid #fca5a5; }

    /* CARDS */
    .cards-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .card {
      border-radius: var(--radius); padding: 24px; color: #fff;
      box-shadow: var(--shadow);
    }
    .card-available { background: linear-gradient(135deg, var(--clr-available-from), var(--clr-available-to)); }
    .card-emergency { background: linear-gradient(135deg, var(--clr-emergency-from), var(--clr-emergency-to)); }
    .card-label { font-size: .75rem; letter-spacing: .1em; text-transform: uppercase; opacity: .85; margin: 0 0 8px; }
    .card-amount { font-size: 2rem; font-weight: 700; margin: 0 0 4px; }
    .card-sub { font-size: .85rem; opacity: .8; margin: 0 0 12px; }

    /* PROGRESS */
    .progress-bar-track {
      background: rgba(255,255,255,.25); border-radius: 99px; height: 8px; overflow: hidden; margin: 8px 0 4px;
    }
    .progress-bar-track.large { height: 14px; background: #d1fae5; }
    .progress-bar-fill { height: 100%; background: #fff; border-radius: 99px; transition: width .4s ease; }
    .progress-bar-track.large .progress-bar-fill { background: var(--clr-primary); }
    .progress-label { font-size: .8rem; opacity: .85; margin: 0 0 8px; }
    .loading-text { color: var(--clr-muted); }

    /* RESILIENCE BADGE */
    .resilience-badge {
      display: inline-block; padding: 3px 10px; border-radius: 99px;
      font-size: .75rem; font-weight: 600; color: #fff;
    }
    .resilience-badge.INSUFFISANT { background: var(--clr-danger); }
    .resilience-badge.EN_COURS    { background: var(--clr-warn); }
    .resilience-badge.PRET        { background: var(--clr-info); }
    .resilience-badge.EXCELLENT   { background: var(--clr-success); }

    /* TABS */
    .tabs {
      display: flex; gap: 4px; background: #fff; padding: 6px;
      border-radius: var(--radius); box-shadow: var(--shadow); margin-bottom: 24px;
    }
    .tab-btn {
      flex: 1; padding: 10px 12px; border: none; background: transparent;
      border-radius: 8px; cursor: pointer; font-size: .9rem; color: var(--clr-muted);
      transition: all .2s;
    }
    .tab-btn.active { background: var(--clr-primary); color: #fff; font-weight: 600; }
    .tab-btn:hover:not(.active) { background: #f0fdf4; color: var(--clr-primary-dark); }

    /* TAB CONTENT */
    .tab-content { animation: fadeIn .2s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

    /* FORMS */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-card {
      background: #fff; border-radius: var(--radius); padding: 24px;
      box-shadow: var(--shadow);
    }
    .form-card-centered { max-width: 480px; margin: 0 auto; }
    .form-title { font-size: 1rem; font-weight: 600; color: var(--clr-available-from); margin: 0 0 16px; }
    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; font-size: .85rem; color: var(--clr-muted); margin-bottom: 5px; }
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%; padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 8px;
      font-size: .95rem; color: var(--clr-text); background: #fafafa;
      box-sizing: border-box; transition: border-color .2s;
    }
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none; border-color: var(--clr-primary); background: #fff;
    }

    /* TOGGLE */
    .toggle-group { display: flex; align-items: center; justify-content: space-between; }
    .toggle-switch { position: relative; display: inline-block; width: 40px; height: 22px; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute; cursor: pointer; inset: 0;
      background: #d1d5db; border-radius: 22px; transition: .3s;
    }
    .toggle-slider::before {
      content: ''; position: absolute;
      height: 16px; width: 16px; left: 3px; bottom: 3px;
      background: #fff; border-radius: 50%; transition: .3s;
    }
    .toggle-switch input:checked + .toggle-slider { background: var(--clr-primary); }
    .toggle-switch input:checked + .toggle-slider::before { transform: translateX(18px); }

    /* BUTTONS */
    .btn {
      padding: 10px 20px; border-radius: 8px; border: none;
      cursor: pointer; font-size: .9rem; font-weight: 600; transition: all .2s;
    }
    .btn:disabled { opacity: .55; cursor: not-allowed; }
    .btn-primary { background: var(--clr-primary); color: #fff; }
    .btn-primary:hover:not(:disabled) { background: var(--clr-primary-dark); }
    .btn-outline {
      background: transparent; color: var(--clr-primary);
      border: 1.5px solid var(--clr-primary);
    }
    .btn-outline:hover:not(:disabled) { background: #f0fdf4; }
    .btn-danger { background: var(--clr-danger); color: #fff; }
    .btn-danger:hover:not(:disabled) { background: #dc2626; }
    .btn-full { width: 100%; margin-top: 4px; }

    /* EMERGENCY SUMMARY */
    .emergency-summary { background: #fff; border-radius: var(--radius); padding: 20px; margin-bottom: 20px; box-shadow: var(--shadow); }
    .emergency-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: .9rem; }

    /* WITHDRAWALS LIST */
    .section-title { font-size: 1rem; font-weight: 600; color: var(--clr-available-from); margin: 24px 0 12px; }
    .withdrawals-list { display: flex; flex-direction: column; gap: 12px; }
    .withdrawal-item {
      background: #fff; border-radius: var(--radius); padding: 16px;
      box-shadow: var(--shadow); border-left: 4px solid var(--clr-primary);
    }
    .withdrawal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .withdrawal-amount { font-weight: 700; font-size: 1.05rem; color: var(--clr-available-from); }
    .withdrawal-reason { font-size: .85rem; color: var(--clr-muted); margin: 0 0 4px; }
    .withdrawal-date { font-size: .8rem; color: #9ca3af; margin: 0 0 4px; }
    .withdrawal-note { font-size: .82rem; color: var(--clr-info); margin: 0; }

    /* STATUS BADGES */
    .status-badge {
      padding: 3px 10px; border-radius: 99px; font-size: .75rem; font-weight: 600; color: #fff;
    }
    .status-PENDING  { background: var(--clr-warn); }
    .status-APPROVED { background: var(--clr-success); }
    .status-REJECTED { background: var(--clr-danger); }
    .status-PAID     { background: var(--clr-info); }

    /* TABLE */
    .table-wrapper { overflow-x: auto; background: #fff; border-radius: var(--radius); box-shadow: var(--shadow); }
    .tx-table { width: 100%; border-collapse: collapse; font-size: .88rem; }
    .tx-table thead th {
      background: var(--clr-available-from); color: #fff;
      padding: 12px 14px; text-align: left; font-weight: 600;
    }
    .tx-table thead th:first-child { border-radius: var(--radius) 0 0 0; }
    .tx-table thead th:last-child  { border-radius: 0 var(--radius) 0 0; }
    .tx-table tbody tr:nth-child(even) { background: #f9fafb; }
    .tx-table tbody tr:hover { background: #f0fdf4; }
    .tx-table tbody td { padding: 11px 14px; border-bottom: 1px solid #f3f4f6; }
    .tx-type {
      padding: 2px 8px; border-radius: 6px; font-size: .78rem; font-weight: 600;
      background: #d1fae5; color: #065f46;
    }
    .tx-amount.positive { color: var(--clr-success); font-weight: 600; }
    .tx-amount.negative { color: var(--clr-danger); font-weight: 600; }

    .load-more-row { display: flex; justify-content: center; padding: 16px 0; }
    .empty-text { text-align: center; color: var(--clr-muted); padding: 24px 0; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }

    /* FORM FOCUS HIGHLIGHT */
    .form-card.form-focused {
      border: 2px solid var(--clr-primary);
      box-shadow: 0 0 0 4px rgba(82,183,136,.18);
      animation: focusPulse .5s ease;
    }
    @keyframes focusPulse {
      0%   { box-shadow: 0 0 0 0 rgba(82,183,136,.45); }
      100% { box-shadow: 0 0 0 8px rgba(82,183,136,0); }
    }

    @media (max-width: 680px) {
      .cards-row { grid-template-columns: 1fr; }
      .form-grid  { grid-template-columns: 1fr; }
      .tabs { flex-wrap: wrap; }
    }
  `]
})
export class WalletComponent implements OnInit {
  private walletService = inject(WalletService);

  @ViewChild('depositCard')  depositCardRef!:  ElementRef;
  @ViewChild('withdrawCard') withdrawCardRef!: ElementRef;

  wallet       = signal<WalletDto | null>(null);
  transactions = signal<WalletTransactionDto[]>([]);
  withdrawals  = signal<EmergencyWithdrawalDto[]>([]);
  activeTab    = signal<Tab>('ops');
  loading      = signal(false);
  successMsg   = signal('');
  errorMsg     = signal('');
  focusForm    = signal<'deposit' | 'withdraw' | null>(null);

  // Ops form
  depositAmount  = 0;
  depositDesc    = '';
  withdrawAmount = 0;
  withdrawDesc   = '';

  // Emergency configure
  cfgTarget       = 0;
  cfgAutoEnabled  = false;
  cfgAutoPct      = 0;
  cfgContribDay   = 1;

  // Contribute
  contributeAmount = 0;

  // Emergency withdrawal request
  ewAmount = 0;
  ewReason = '';
  ewDesc   = '';

  // Transfer
  transferEmail  = '';
  transferAmount = 0;
  transferDesc   = '';

  // Pagination
  private txPage = 0;

  ngOnInit(): void {
    this.loadWallet();
    this.loadTransactions();
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (tab === 'emergency') {
      this.loadWithdrawals();
    }
  }

  clickRecharge(): void {
    this.setTab('ops');
    this.focusForm.set('deposit');
    setTimeout(() => {
      this.depositCardRef?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
    setTimeout(() => this.focusForm.set(null), 2000);
  }

  clickWithdraw(): void {
    this.setTab('ops');
    this.focusForm.set('withdraw');
    setTimeout(() => {
      this.withdrawCardRef?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
    setTimeout(() => this.focusForm.set(null), 2000);
  }

  loadWallet(): void {
    this.walletService.getMyWallet().subscribe({
      next: w => {
        this.wallet.set(w);
        this.cfgTarget      = w.emergencyTargetAmount ?? 0;
        this.cfgAutoEnabled = w.emergencyAutoContribute ?? false;
        this.cfgAutoPct     = w.emergencyMonthlyContribution ?? 0;
        this.cfgContribDay  = w.emergencyContributionDay ?? 1;
      },
      error: err => this.showError(err?.error?.message ?? 'Erreur chargement portefeuille')
    });
  }

  loadTransactions(): void {
    this.walletService.getTransactions(this.txPage).subscribe({
      next: txs => {
        if (this.txPage === 0) {
          this.transactions.set(txs);
        } else {
          this.transactions.update(prev => [...prev, ...txs]);
        }
      },
      error: () => {}
    });
  }

  loadWithdrawals(): void {
    this.walletService.getMyWithdrawals().subscribe({
      next: ws => this.withdrawals.set(ws),
      error: () => {}
    });
  }

  loadMore(): void {
    this.txPage++;
    this.loadTransactions();
  }

  onDeposit(): void {
    if (!this.depositAmount) return;
    this.loading.set(true);
    this.walletService.deposit({ amount: this.depositAmount, description: this.depositDesc }).subscribe({
      next: w => {
        this.wallet.set(w);
        this.depositAmount = 0;
        this.depositDesc   = '';
        this.showSuccess('Dépôt effectué avec succès.');
        this.txPage = 0;
        this.loadTransactions();
      },
      error: err => this.showError(err?.error?.message ?? 'Erreur lors du dépôt')
    });
  }

  onWithdraw(): void {
    if (!this.withdrawAmount) return;
    this.loading.set(true);
    this.walletService.withdraw({ amount: this.withdrawAmount, description: this.withdrawDesc }).subscribe({
      next: w => {
        this.wallet.set(w);
        this.withdrawAmount = 0;
        this.withdrawDesc   = '';
        this.showSuccess('Retrait effectué avec succès.');
        this.txPage = 0;
        this.loadTransactions();
      },
      error: err => this.showError(err?.error?.message ?? 'Erreur lors du retrait')
    });
  }

  onTransfer(): void {
    if (!this.transferEmail) {
      this.showError('Veuillez saisir l\'email du destinataire.');
      return;
    }
    if (!this.transferAmount || this.transferAmount <= 0) {
      this.showError('Veuillez saisir un montant valide.');
      return;
    }
    this.loading.set(true);
    this.walletService.transfer({
      recipientEmail: this.transferEmail,
      amount: this.transferAmount,
      description: this.transferDesc
    }).subscribe({
      next: w => {
        this.wallet.set(w);
        this.transferEmail  = '';
        this.transferAmount = 0;
        this.transferDesc   = '';
        this.showSuccess('Virement effectué avec succès.');
        this.txPage = 0;
        this.loadTransactions();
      },
      error: err => {
        const msg = err?.error?.message ?? err?.error ?? 'Erreur lors du virement';
        this.showError(typeof msg === 'string' ? msg : 'Erreur lors du virement');
      }
    });
  }

  onConfigureEmergency(): void {
    this.loading.set(true);
    this.walletService.configureEmergency({
      targetAmount: this.cfgTarget,
      monthlyContribution: this.cfgAutoPct,
      autoContribute: this.cfgAutoEnabled,
      contributionDay: this.cfgContribDay
    }).subscribe({
      next: w => { this.wallet.set(w); this.showSuccess('Configuration enregistrée.'); },
      error: err => this.showError(err?.error?.message ?? 'Erreur de configuration')
    });
  }

  onContribute(): void {
    if (!this.contributeAmount) return;
    this.loading.set(true);
    this.walletService.topUpEmergency({ amount: this.contributeAmount }).subscribe({
      next: w => {
        this.wallet.set(w);
        this.contributeAmount = 0;
        this.showSuccess('Contribution ajoutée.');
        this.txPage = 0;
        this.loadTransactions();
      },
      error: err => this.showError(err?.error?.message ?? 'Erreur contribution')
    });
  }

  onRequestWithdrawal(): void {
    if (!this.ewAmount || !this.ewReason) return;
    this.loading.set(true);
    this.walletService.requestEmergencyWithdrawal({
      amount: this.ewAmount,
      reason: this.ewReason,
      description: this.ewDesc
    }).subscribe({
      next: () => {
        this.ewAmount = 0;
        this.ewReason = '';
        this.ewDesc   = '';
        this.showSuccess('Demande de retrait soumise.');
        this.loadWithdrawals();
      },
      error: err => this.showError(err?.error?.message ?? 'Erreur demande de retrait')
    });
  }

  // Helpers
  clampPct(val: number): number {
    return Math.min(100, Math.max(0, val ?? 0));
  }

  resilienceClass(r: string): Record<string, boolean> {
    return {
      INSUFFISANT: r === 'INSUFFISANT',
      EN_COURS:    r === 'EN_COURS',
      PRET:        r === 'PRET',
      EXCELLENT:   r === 'EXCELLENT'
    };
  }

  statusClass(s: string): Record<string, boolean> {
    return {
      'status-PENDING':  s === 'PENDING',
      'status-APPROVED': s === 'APPROVED',
      'status-REJECTED': s === 'REJECTED',
      'status-PAID':     s === 'PAID'
    };
  }

  txTypeClass(t: string): Record<string, boolean> {
    return {};
  }

  private showSuccess(msg: string): void {
    this.loading.set(false);
    this.successMsg.set(msg);
    this.errorMsg.set('');
    setTimeout(() => this.successMsg.set(''), 3000);
  }

  private showError(msg: string): void {
    this.loading.set(false);
    this.errorMsg.set(msg);
    this.successMsg.set('');
    setTimeout(() => this.errorMsg.set(''), 3000);
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SavingsService, SavingsAccount, SavingsTransaction, SavingsGoal } from './savings.service';
import { SavingsAIService } from './savings-ai.service';

type Tab = 'compte' | 'transactions' | 'objectifs' | 'analytiques' | 'ia';

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './savings.component.html',
  styleUrl: './savings.component.css'
})
export class SavingsComponent implements OnInit {
  private savingsService = inject(SavingsService);
  private aiService = inject(SavingsAIService);
  private fb = inject(FormBuilder);

  activeTab: Tab = 'compte';
  account: SavingsAccount | null = null;
  hasAccount = false;
  isLoading = false;
  apiError = '';

  // Account
  accountForm!: FormGroup;
  showEditAccount = false;

  // Transactions
  transactions: SavingsTransaction[] = [];
  txFilter = '';
  showTxForm = false;
  txForm!: FormGroup;
  txLoading = false;
  txError = '';

  // Goals
  goals: SavingsGoal[] = [];
  archivedGoals: SavingsGoal[] = [];
  showGoalForm = false;
  showArchived = false;
  goalForm!: FormGroup;
  editingGoalId: string | null = null;
  goalLoading = false;

  // Analytics
  monthlySummary: any = null;
  alerts: any = null;
  recommendation: any = null;
  simulateAmount = 0;
  simulateResult: any = null;
  analyticsLoading = false;
  statementFrom = '';
  statementTo = '';
  statement: any = null;

  // AI
  aiGoalPrediction: any = null;
  aiSmartPlan: any = null;
  aiRiskAmount = 0;
  aiRiskResult: any = null;
  aiEmergencyFund: any = null;
  aiLoading = false;

  // ML Savings Alert (Notebook Module 3)
  mlAlertForm!: FormGroup;
  mlAlertResult: any = null;
  mlAlertLoading = false;
  mlAlertError = '';

  ngOnInit(): void {
    this.initForms();
    this.loadAccount();
  }

  private initForms(): void {
    this.accountForm = this.fb.group({
      accountName: ['', Validators.required],
      monthlySavingsTarget: [500, [Validators.required, Validators.min(1)]]
    });
    this.txForm = this.fb.group({
      type: ['DEPOSIT', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      description: ['', Validators.required]
    });
    this.goalForm = this.fb.group({
      goalName: ['', Validators.required],
      targetAmount: [null, [Validators.required, Validators.min(1)]],
      targetDate: ['', Validators.required],
      description: ['']
    });
    this.mlAlertForm = this.fb.group({
      revenue:            [null, [Validators.required, Validators.min(0)]],
      expenses:           [null, [Validators.required, Validators.min(0)]],
      loanAmount:         [0, [Validators.required, Validators.min(0)]],
      droughtIndex:       [3, [Validators.required, Validators.min(0), Validators.max(10)]],
      floodRiskScore:     [2, [Validators.required, Validators.min(0), Validators.max(10)]],
      policySupportScore: [5, [Validators.required, Validators.min(0), Validators.max(10)]]
    });
  }

  // ─── Account ───────────────────────────────────────────

  loadAccount(): void {
    this.isLoading = true;
    this.apiError = '';
    this.savingsService.getMyAccount().subscribe({
      next: (acc) => {
        this.account = acc;
        this.hasAccount = true;
        this.isLoading = false;
        this.loadTransactions();
        this.loadGoals();
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 404) {
          this.hasAccount = false;
        } else {
          this.apiError = err.status === 0
            ? 'Impossible de joindre le serveur — vérifiez que le backend est démarré.'
            : `Erreur serveur (${err.status})`;
        }
      }
    });
  }

  createAccount(): void {
    if (this.accountForm.invalid) return;
    this.isLoading = true;
    this.savingsService.createAccount(this.accountForm.value).subscribe({
      next: (acc) => {
        this.account = acc;
        this.hasAccount = true;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.apiError = err.status === 0
          ? 'Impossible de joindre le serveur.'
          : 'Erreur lors de la création du compte.';
      }
    });
  }

  saveAccountEdit(): void {
    if (!this.account) return;
    this.savingsService.updateAccount({
      accountName: this.account.accountName,
      monthlySavingsTarget: this.account.monthlySavingsTarget
    }).subscribe({
      next: (acc) => { this.account = acc; this.showEditAccount = false; },
      error: () => { this.apiError = 'Erreur lors de la mise à jour.'; }
    });
  }

  toggleAccountStatus(): void {
    if (!this.account) return;
    const newStatus = this.account.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    this.savingsService.updateAccount({ status: newStatus }).subscribe({
      next: (acc) => { this.account = acc; },
      error: () => { this.apiError = 'Erreur lors du changement de statut.'; }
    });
  }

  // ─── Transactions ──────────────────────────────────────

  loadTransactions(): void {
    this.txError = '';
    this.savingsService.getTransactions(this.txFilter || undefined).subscribe({
      next: (txs) => { this.transactions = txs; },
      error: (err) => {
        this.txError = err.status === 0
          ? 'Impossible de charger les transactions.'
          : `Erreur (${err.status})`;
      }
    });
  }

  applyTxFilter(filter: string): void {
    this.txFilter = filter;
    this.loadTransactions();
  }

  submitTransaction(): void {
    if (this.txForm.invalid) return;
    this.txLoading = true;
    this.savingsService.addTransaction(this.txForm.value).subscribe({
      next: (tx) => {
        this.transactions.unshift(tx);
        this.txForm.reset({ type: 'DEPOSIT' });
        this.showTxForm = false;
        this.txLoading = false;
        this.loadAccount();
      },
      error: () => { this.txLoading = false; this.txError = 'Erreur lors de la transaction.'; }
    });
  }

  // ─── Goals ─────────────────────────────────────────────

  loadGoals(): void {
    this.savingsService.getGoals().subscribe({
      next: (g) => { this.goals = g; },
      error: () => {}
    });
  }

  loadArchivedGoals(): void {
    this.savingsService.getArchivedGoals().subscribe({
      next: (g) => { this.archivedGoals = g; this.showArchived = true; },
      error: () => {}
    });
  }

  submitGoal(): void {
    if (this.goalForm.invalid) return;
    this.goalLoading = true;
    const obs = this.editingGoalId
      ? this.savingsService.updateGoal(this.editingGoalId, this.goalForm.value)
      : this.savingsService.createGoal(this.goalForm.value);
    obs.subscribe({
      next: () => {
        this.loadGoals();
        this.loadAccount();
        this.showGoalForm = false;
        this.editingGoalId = null;
        this.goalForm.reset();
        this.goalLoading = false;
      },
      error: () => { this.goalLoading = false; this.apiError = "Erreur lors de la sauvegarde de l'objectif."; }
    });
  }

  editGoal(goal: SavingsGoal): void {
    this.editingGoalId = goal.id;
    this.goalForm.patchValue({
      goalName: goal.goalName,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      description: goal.description
    });
    this.showGoalForm = true;
  }

  deleteGoal(id: string): void {
    if (!confirm('Supprimer cet objectif ?')) return;
    this.savingsService.deleteGoal(id).subscribe({
      next: () => { this.loadGoals(); this.loadAccount(); },
      error: () => {}
    });
  }

  collectGoal(goal: SavingsGoal): void {
    if (!goal.achieved) return;
    this.savingsService.collectGoal(goal.id).subscribe({
      next: () => { this.loadGoals(); },
      error: () => {}
    });
  }

  setGoalPriority(id: string, priority: number): void {
    this.savingsService.setGoalPriority(id, { priority }).subscribe({
      next: () => { this.loadGoals(); },
      error: () => {}
    });
  }

  cancelGoalForm(): void {
    this.showGoalForm = false;
    this.editingGoalId = null;
    this.goalForm.reset();
  }

  // ─── Analytics ─────────────────────────────────────────

  loadAnalytics(): void {
    this.analyticsLoading = true;
    this.savingsService.getMonthlySummary(6).subscribe({
      next: (s) => { this.monthlySummary = s; this.analyticsLoading = false; },
      error: () => { this.analyticsLoading = false; }
    });
    this.savingsService.getAlerts().subscribe({ next: (a) => { this.alerts = a; }, error: () => {} });
    this.savingsService.getRecommendation().subscribe({ next: (r) => { this.recommendation = r; }, error: () => {} });
  }

  simulate(): void {
    if (!this.simulateAmount) return;
    this.savingsService.simulateWithdrawal(this.simulateAmount).subscribe({
      next: (r) => { this.simulateResult = r; },
      error: () => {}
    });
  }

  loadStatement(): void {
    if (!this.statementFrom || !this.statementTo) return;
    this.savingsService.getStatement(this.statementFrom, this.statementTo).subscribe({
      next: (s) => { this.statement = s; },
      error: () => {}
    });
  }

  // ─── AI ────────────────────────────────────────────────

  loadAI(): void {
    this.aiLoading = true;
    this.aiService.predictGoalAchievement().subscribe({
      next: (r) => { this.aiGoalPrediction = r; this.aiLoading = false; },
      error: () => { this.aiLoading = false; }
    });
    this.aiService.getSmartPlan().subscribe({ next: (r) => { this.aiSmartPlan = r; }, error: () => {} });
    this.aiService.getEmergencyFund().subscribe({ next: (r) => { this.aiEmergencyFund = r; }, error: () => {} });
  }

  assessWithdrawalRisk(): void {
    if (!this.aiRiskAmount) return;
    this.aiService.assessWithdrawalRisk(this.aiRiskAmount).subscribe({
      next: (r) => { this.aiRiskResult = r; },
      error: () => {}
    });
  }

  autoFillAlertForm(): void {
    const rev = this.totalDeposits;
    const exp = this.totalWithdrawals;
    if (rev > 0 || exp > 0) {
      this.mlAlertForm.patchValue({ revenue: Math.round(rev), expenses: Math.round(exp) });
    }
  }

  runMLSavingsAlert(): void {
    if (this.mlAlertForm.invalid) return;
    this.mlAlertLoading = true;
    this.mlAlertError = '';
    this.mlAlertResult = null;
    this.aiService.predictSavingsAlert(this.mlAlertForm.value).subscribe({
      next: (r) => { this.mlAlertResult = r; this.mlAlertLoading = false; },
      error: () => {
        this.mlAlertError = 'Service ML indisponible — vérifiez que finance_ai_service.py est démarré (port 8002).';
        this.mlAlertLoading = false;
      }
    });
  }

  // ─── Tab Navigation ────────────────────────────────────

  setTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab === 'transactions') this.loadTransactions();
    if (tab === 'objectifs') this.loadGoals();
    if (tab === 'analytiques') this.loadAnalytics();
    if (tab === 'ia') this.loadAI();
  }

  // ─── Computed ──────────────────────────────────────────

  get totalDeposits(): number {
    return this.transactions.filter(t => t.type === 'DEPOSIT').reduce((s, t) => s + t.amount, 0);
  }
  get totalWithdrawals(): number {
    return this.transactions.filter(t => t.type === 'WITHDRAWAL').reduce((s, t) => s + t.amount, 0);
  }
  get achievedGoalsCount(): number {
    return this.goals.filter(g => g.achieved).length;
  }

  // ─── Helpers ───────────────────────────────────────────

  getProgressColor(pct: number): string {
    if (pct >= 100) return '#1b4332';
    if (pct >= 75) return '#40916c';
    if (pct >= 50) return '#52b788';
    if (pct >= 25) return '#f3a835';
    return '#e07b54';
  }

  getSeverityClass(severity: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'alert-critical', HIGH: 'alert-high', MEDIUM: 'alert-medium',
      LOW: 'alert-low', WARNING: 'alert-high', INFO: 'alert-low'
    };
    return map[severity] || 'alert-low';
  }

  getRiskColor(riskLevel: string): string {
    const map: Record<string, string> = { LOW: '#40916c', MEDIUM: '#f3a835', HIGH: '#e07b54', CRITICAL: '#d62828' };
    return map[riskLevel] || '#40916c';
  }

  getProtectionColor(level: string): string {
    const map: Record<string, string> = { NONE: '#d62828', LOW: '#e07b54', MODERATE: '#f3a835', GOOD: '#40916c', EXCELLENT: '#1b4332' };
    return map[level] || '#40916c';
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = { ON_TRACK: '#40916c', AT_RISK: '#f3a835', ACHIEVED: '#1b4332', BLOCKED: '#d62828' };
    return map[status] || '#40916c';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { ON_TRACK: 'En cours', AT_RISK: 'À risque', ACHIEVED: 'Atteint', BLOCKED: 'Bloqué' };
    return map[status] || status;
  }
}

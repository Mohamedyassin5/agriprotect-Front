import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccountingService, AccountingEntry, Budget, ENTRY_CATEGORIES } from './accounting.service';
import { AccountingAIService } from './accounting-ai.service';

type Tab = 'ecritures' | 'budgets' | 'analytiques' | 'ia';

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './accounting.component.html',
  styleUrl: './accounting.component.css'
})
export class AccountingComponent implements OnInit {
  private accountingService = inject(AccountingService);
  private aiService = inject(AccountingAIService);
  private fb = inject(FormBuilder);

  activeTab: Tab = 'ecritures';
  categories = ENTRY_CATEGORIES;

  // Entries
  entries: AccountingEntry[] = [];
  entriesLoading = false;
  entriesError = '';
  showEntryForm = false;
  entryForm!: FormGroup;
  editingEntryId: number | null = null;
  entryFilter: { type?: string } = {};

  // Budgets
  budgets: Budget[] = [];
  budgetsLoading = false;
  budgetsError = '';
  showBudgetForm = false;
  budgetForm!: FormGroup;
  editingBudgetId: number | null = null;

  // Analytics
  analyticsLoading = false;
  analyticsFrom = '';
  analyticsTo = '';
  summary: any = null;
  budgetVsActual: any = null;
  spendingBreakdown: any = null;
  cashflowForecast: any = null;
  overspendingAlerts: any = null;
  anomalies: any = null;

  // AI
  aiLoading = false;
  healthScore: any = null;
  expenseForecast: any = null;
  profitabilityTrends: any = null;
  predictiveAlerts: any = null;
  categorizationDesc = '';
  categorizationResult: any = null;
  whatIfForm!: FormGroup;
  whatIfResult: any = null;
  whatIfLoading = false;

  // ML Financial Risk Prediction (Notebook Module 2)
  mlRiskForm!: FormGroup;
  mlRiskResult: any = null;
  mlRiskLoading = false;
  mlRiskError = '';

  ngOnInit(): void {
    this.initForms();
    this.loadEntries();
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.analyticsFrom = firstDay.toISOString().split('T')[0];
    this.analyticsTo = lastDay.toISOString().split('T')[0];
  }

  private initForms(): void {
    this.entryForm = this.fb.group({
      entryType: ['INCOME', Validators.required],
      category: ['SALES', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      description: ['', Validators.required],
      entryDate: ['', Validators.required]
    });
    this.budgetForm = this.fb.group({
      periodType: ['MONTHLY', Validators.required],
      periodStart: ['', Validators.required],
      periodEnd: ['', Validators.required],
      category: ['SEEDS', Validators.required],
      plannedAmount: [null, [Validators.required, Validators.min(1)]]
    });
    this.whatIfForm = this.fb.group({
      fertilizerChange: [0],
      laborChange: [0],
      transportChange: [0],
      incomeChangePercent: [0],
      simulationMonths: [6, [Validators.required, Validators.min(1)]]
    });
    this.mlRiskForm = this.fb.group({
      revenue:        [null, [Validators.required, Validators.min(0)]],
      expenses:       [null, [Validators.required, Validators.min(0)]],
      debtToEquity:   [0.5, [Validators.required, Validators.min(0)]],
      netProfit:      [null, [Validators.required]],
      avgTemperature: [28, [Validators.required]],
      rainfall:       [400, [Validators.required]],
      droughtIndex:   [3, [Validators.required, Validators.min(0), Validators.max(10)]],
      floodRiskScore: [2, [Validators.required, Validators.min(0), Validators.max(10)]]
    });
  }

  // ─── Entries ───────────────────────────────────────────

  loadEntries(): void {
    this.entriesLoading = true;
    this.entriesError = '';
    this.accountingService.getEntries(this.entryFilter).subscribe({
      next: (e) => { this.entries = e; this.entriesLoading = false; },
      error: (err) => {
        this.entriesLoading = false;
        this.entriesError = err.status === 0
          ? 'Impossible de joindre le serveur — vérifiez que le backend est démarré.'
          : `Erreur serveur (${err.status})`;
      }
    });
  }

  applyEntryFilter(type?: string): void {
    this.entryFilter = type ? { type } : {};
    this.loadEntries();
  }

  submitEntry(): void {
    if (this.entryForm.invalid) return;
    const obs = this.editingEntryId
      ? this.accountingService.updateEntry(this.editingEntryId, this.entryForm.value)
      : this.accountingService.addEntry(this.entryForm.value);
    obs.subscribe({
      next: () => {
        this.loadEntries();
        this.showEntryForm = false;
        this.editingEntryId = null;
        this.entryForm.reset({ entryType: 'INCOME', category: 'SALES' });
      },
      error: () => {}
    });
  }

  editEntry(entry: AccountingEntry): void {
    this.editingEntryId = entry.id;
    this.entryForm.patchValue({
      entryType: entry.entryType,
      category: entry.category,
      amount: entry.amount,
      description: entry.description,
      entryDate: entry.entryDate
    });
    this.showEntryForm = true;
  }

  deleteEntry(id: number): void {
    if (!confirm('Supprimer cette écriture ?')) return;
    this.accountingService.deleteEntry(id).subscribe({
      next: () => { this.entries = this.entries.filter(e => e.id !== id); },
      error: () => {}
    });
  }

  cancelEntryForm(): void {
    this.showEntryForm = false;
    this.editingEntryId = null;
    this.entryForm.reset({ entryType: 'INCOME', category: 'SALES' });
  }

  get totalIncome(): number {
    return this.entries.filter(e => e.entryType === 'INCOME').reduce((s, e) => s + e.amount, 0);
  }
  get totalExpense(): number {
    return this.entries.filter(e => e.entryType === 'EXPENSE').reduce((s, e) => s + e.amount, 0);
  }
  get netResult(): number { return this.totalIncome - this.totalExpense; }
  get avgEntryAmount(): number {
    if (!this.entries.length) return 0;
    return this.entries.reduce((s, e) => s + e.amount, 0) / this.entries.length;
  }
  get maxEntryAmount(): number {
    if (!this.entries.length) return 0;
    return Math.max(...this.entries.map(e => e.amount));
  }
  get minEntryAmount(): number {
    if (!this.entries.length) return 0;
    return Math.min(...this.entries.map(e => e.amount));
  }

  // ─── Budgets ───────────────────────────────────────────

  loadBudgets(): void {
    this.budgetsLoading = true;
    this.budgetsError = '';
    this.accountingService.getBudgets().subscribe({
      next: (b) => { this.budgets = b; this.budgetsLoading = false; },
      error: (err) => {
        this.budgetsLoading = false;
        this.budgetsError = err.status === 0
          ? 'Impossible de joindre le serveur.'
          : `Erreur serveur (${err.status})`;
      }
    });
  }

  submitBudget(): void {
    if (this.budgetForm.invalid) return;
    const obs = this.editingBudgetId
      ? this.accountingService.updateBudget(this.editingBudgetId, this.budgetForm.value)
      : this.accountingService.createBudget(this.budgetForm.value);
    obs.subscribe({
      next: () => {
        this.loadBudgets();
        this.showBudgetForm = false;
        this.editingBudgetId = null;
        this.budgetForm.reset({ periodType: 'MONTHLY', category: 'SEEDS' });
      },
      error: () => {}
    });
  }

  editBudget(budget: Budget): void {
    this.editingBudgetId = budget.id;
    this.budgetForm.patchValue(budget);
    this.showBudgetForm = true;
  }

  deleteBudget(id: number): void {
    if (!confirm('Supprimer ce budget ?')) return;
    this.accountingService.deleteBudget(id).subscribe({
      next: () => { this.budgets = this.budgets.filter(b => b.id !== id); },
      error: () => {}
    });
  }

  cancelBudgetForm(): void {
    this.showBudgetForm = false;
    this.editingBudgetId = null;
    this.budgetForm.reset({ periodType: 'MONTHLY', category: 'SEEDS' });
  }

  get totalBudgeted(): number {
    return this.budgets.reduce((s, b) => s + b.plannedAmount, 0);
  }

  // ─── Analytics ─────────────────────────────────────────

  loadAnalytics(): void {
    this.analyticsLoading = true;
    const from = this.analyticsFrom;
    const to = this.analyticsTo;
    this.accountingService.getSummary(from, to).subscribe({
      next: (s) => { this.summary = s; this.analyticsLoading = false; },
      error: () => { this.analyticsLoading = false; }
    });
    this.accountingService.getBudgetVsActual(from, to).subscribe({
      next: (s) => { this.budgetVsActual = s; }, error: () => {}
    });
    this.accountingService.getSpendingBreakdown(from, to).subscribe({
      next: (s) => { this.spendingBreakdown = s; }, error: () => {}
    });
    this.accountingService.getCashflowForecast().subscribe({
      next: (s) => { this.cashflowForecast = s; }, error: () => {}
    });
    this.accountingService.getOverspendingAlerts(from, to).subscribe({
      next: (s) => { this.overspendingAlerts = s; }, error: () => {}
    });
    this.accountingService.getAnomalies(from, to).subscribe({
      next: (s) => { this.anomalies = s; }, error: () => {}
    });
  }

  // ─── AI ────────────────────────────────────────────────

  loadAI(): void {
    this.aiLoading = true;
    this.aiService.getHealthScore().subscribe({
      next: (r) => { this.healthScore = r; this.aiLoading = false; },
      error: () => { this.aiLoading = false; }
    });
    this.aiService.forecastExpenses().subscribe({ next: (r) => { this.expenseForecast = r; }, error: () => {} });
    this.aiService.getProfitabilityTrends().subscribe({ next: (r) => { this.profitabilityTrends = r; }, error: () => {} });
    this.aiService.getPredictiveBudgetAlerts().subscribe({ next: (r) => { this.predictiveAlerts = r; }, error: () => {} });
  }

  categorize(): void {
    if (!this.categorizationDesc) return;
    this.aiService.categorizeTransaction(this.categorizationDesc).subscribe({
      next: (r) => { this.categorizationResult = r; }, error: () => {}
    });
  }

  runWhatIf(): void {
    if (this.whatIfForm.invalid) return;
    this.whatIfLoading = true;
    const v = this.whatIfForm.value;
    this.aiService.simulateWhatIf({
      categoryChanges: { FERTILIZER: v.fertilizerChange, LABOR: v.laborChange, TRANSPORT: v.transportChange },
      incomeChangePercent: v.incomeChangePercent,
      simulationMonths: v.simulationMonths
    }).subscribe({
      next: (r) => { this.whatIfResult = r; this.whatIfLoading = false; },
      error: () => { this.whatIfLoading = false; }
    });
  }

  autoFillRiskForm(): void {
    const rev = this.totalIncome;
    const exp = this.totalExpense;
    if (rev > 0 || exp > 0) {
      this.mlRiskForm.patchValue({ revenue: Math.round(rev), expenses: Math.round(exp), netProfit: Math.round(rev - exp) });
    }
  }

  runMLRiskPrediction(): void {
    if (this.mlRiskForm.invalid) return;
    this.mlRiskLoading = true;
    this.mlRiskError = '';
    this.mlRiskResult = null;
    this.aiService.predictFinancialRisk(this.mlRiskForm.value).subscribe({
      next: (r) => { this.mlRiskResult = r; this.mlRiskLoading = false; },
      error: () => {
        this.mlRiskError = 'Service ML indisponible — vérifiez que finance_ai_service.py est démarré (port 8002).';
        this.mlRiskLoading = false;
      }
    });
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab === 'ecritures') this.loadEntries();
    if (tab === 'budgets') this.loadBudgets();
    if (tab === 'analytiques') this.loadAnalytics();
    if (tab === 'ia') this.loadAI();
  }

  // ─── Helpers ───────────────────────────────────────────

  getStatusClass(status: string): string {
    const map: Record<string, string> = { OK: 'tag-ok', WARN: 'tag-warn', ALERT: 'tag-alert' };
    return map[status] || 'tag-ok';
  }

  getSeverityClass(severity: string): string {
    const map: Record<string, string> = { CRITICAL: 'tag-critical', HIGH: 'tag-high', MEDIUM: 'tag-medium', LOW: 'tag-low', MEDIUM_HIGH: 'tag-high' };
    return map[severity] || 'tag-low';
  }

  getHealthColor(score: number): string {
    if (score >= 80) return '#1b4332';
    if (score >= 60) return '#40916c';
    if (score >= 40) return '#e07b39';
    return '#c0392b';
  }

  getTrendColor(trend: string): string {
    const map: Record<string, string> = { GROWING: '#40916c', STABLE: '#e07b39', DECLINING: '#c0392b' };
    return map[trend] || '#40916c';
  }

  getCategoryLabel(cat: string): string {
    const map: Record<string, string> = {
      SALES: 'Ventes', SEEDS: 'Semences', FERTILIZER: 'Engrais', IRRIGATION: 'Irrigation',
      LABOR: "Main d'œuvre", TRANSPORT: 'Transport', EQUIPMENT: 'Équipement',
      INSURANCE: 'Assurance', LOAN_PAYMENT: 'Remb. prêt', OTHER: 'Autre'
    };
    return map[cat] || cat;
  }

  getPeriodLabel(p: string): string {
    const map: Record<string, string> = { MONTHLY: 'Mensuel', SEASONAL: 'Saisonnier', YEARLY: 'Annuel' };
    return map[p] || p;
  }
}

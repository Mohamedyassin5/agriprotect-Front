import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminFinancialService } from './admin-financial.service';

type Tab = 'synthese' | 'distribution' | 'agriculteurs';

@Component({
  selector: 'app-financial-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fo-page">

      <!-- ── Page Header ── -->
      <div class="fo-page-header">
        <div>
          <h4 class="fo-page-title">Financial Overview</h4>
          <p class="fo-page-sub">Vue d'ensemble de la santé financière des agriculteurs</p>
        </div>
        <button class="fo-refresh-btn" (click)="load()" [disabled]="loading()">
          <i class="feather icon-refresh-cw" [class.fo-spinning]="loading()"></i>
          Actualiser
        </button>
      </div>

      <!-- ── Loading ── -->
      <div *ngIf="loading()" class="fo-loading">
        <div class="fo-spinner"></div>
        <p>Chargement des données financières...</p>
      </div>

      <!-- ── Error ── -->
      <div *ngIf="error() && !loading()" class="fo-error-box">
        <i class="feather icon-alert-circle"></i>
        <div>
          <strong>Erreur de chargement</strong>
          <p>{{ error() }}</p>
        </div>
        <button (click)="load()">Réessayer</button>
      </div>

      <ng-container *ngIf="!loading() && !error() && data()">

        <!-- ── Tabs ── -->
        <div class="fo-tabs">
          <button class="fo-tab" [class.fo-tab--active]="activeTab() === 'synthese'"      (click)="activeTab.set('synthese')">
            <i class="feather icon-bar-chart-2"></i> Synthèse
          </button>
          <button class="fo-tab" [class.fo-tab--active]="activeTab() === 'distribution'" (click)="activeTab.set('distribution')">
            <i class="feather icon-pie-chart"></i> Distribution
          </button>
          <button class="fo-tab" [class.fo-tab--active]="activeTab() === 'agriculteurs'" (click)="activeTab.set('agriculteurs')">
            <i class="feather icon-users"></i> Agriculteurs
            <span class="fo-tab-badge">{{ data()?.totalFarmers }}</span>
          </button>
        </div>

        <!-- ════════════ TAB 1 — SYNTHÈSE ════════════ -->
        <div *ngIf="activeTab() === 'synthese'">
          <div class="fo-kpi-grid">
            <div class="fo-kpi-card fo-kpi-blue">
              <div class="fo-kpi-icon"><i class="feather icon-users"></i></div>
              <div class="fo-kpi-body">
                <span class="fo-kpi-label">Total Agriculteurs</span>
                <span class="fo-kpi-val">{{ data()?.totalFarmers }}</span>
                <span class="fo-kpi-hint">inscrits sur la plateforme</span>
              </div>
            </div>
            <div class="fo-kpi-card fo-kpi-green">
              <div class="fo-kpi-icon"><i class="feather icon-dollar-sign"></i></div>
              <div class="fo-kpi-body">
                <span class="fo-kpi-label">Épargne Totale</span>
                <span class="fo-kpi-val">{{ data()?.totalSavingsBalance | number:'1.0-0' }} <small>DT</small></span>
                <span class="fo-kpi-hint">cumul soldes comptes épargne</span>
              </div>
            </div>
            <div class="fo-kpi-card fo-kpi-teal">
              <div class="fo-kpi-icon"><i class="feather icon-activity"></i></div>
              <div class="fo-kpi-body">
                <span class="fo-kpi-label">Score Moyen</span>
                <span class="fo-kpi-val">{{ data()?.averageHealthScore }}<small>/100</small></span>
                <span class="fo-kpi-hint">santé financière globale</span>
              </div>
            </div>
            <div class="fo-kpi-card fo-kpi-red">
              <div class="fo-kpi-icon"><i class="feather icon-alert-triangle"></i></div>
              <div class="fo-kpi-body">
                <span class="fo-kpi-label">À Risque</span>
                <span class="fo-kpi-val fo-danger">{{ data()?.farmersAtRisk }}</span>
                <span class="fo-kpi-hint">score &lt; 35 / 100</span>
              </div>
            </div>
            <div class="fo-kpi-card fo-kpi-orange">
              <div class="fo-kpi-icon"><i class="feather icon-trending-down"></i></div>
              <div class="fo-kpi-body">
                <span class="fo-kpi-label">En Déficit</span>
                <span class="fo-kpi-val fo-danger">{{ data()?.farmersInDeficit }}</span>
                <span class="fo-kpi-hint">dépenses &gt; revenus/mois</span>
              </div>
            </div>
            <div class="fo-kpi-card fo-kpi-emerald">
              <div class="fo-kpi-icon"><i class="feather icon-check-circle"></i></div>
              <div class="fo-kpi-body">
                <span class="fo-kpi-label">En Bonne Santé</span>
                <span class="fo-kpi-val fo-success">{{ data()?.farmersOnTrack }}</span>
                <span class="fo-kpi-hint">score ≥ 65 / 100</span>
              </div>
            </div>
          </div>

          <div class="fo-section">
            <h6 class="fo-section-title">Top agriculteurs les plus à risque — cliquez pour détails</h6>
            <table class="fo-table">
              <thead>
                <tr>
                  <th>Agriculteur</th><th>Score</th><th>Revenu/mois</th>
                  <th>Dépenses/mois</th><th>Alertes</th><th>Risque</th><th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let f of top3Risk()" class="fo-row-clickable"
                    [class.fo-row-critical]="f.riskLevel === 'HIGH'"
                    (click)="openDetail(f)">
                  <td>
                    <div class="fo-user-cell">
                      <div class="fo-avatar" [style.background]="getAvatarColor(f.healthScore)">{{ getInitials(f) }}</div>
                      <div>
                        <div class="fo-user-name">{{ f.firstName }} {{ f.lastName }}</div>
                        <div class="fo-user-email">{{ f.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="fo-score-cell">
                      <div class="fo-score-bar-wrap"><div class="fo-score-bar" [style.width.%]="f.healthScore" [class]="getScoreClass(f.healthScore)"></div></div>
                      <span>{{ f.healthScore }}</span>
                    </div>
                  </td>
                  <td class="fo-num fo-income">+{{ f.monthlyIncome | number:'1.0-0' }} DT</td>
                  <td class="fo-num fo-expense">-{{ f.monthlyExpenses | number:'1.0-0' }} DT</td>
                  <td>
                    <span *ngIf="f.activeBudgetAlerts > 0" class="fo-alert-badge">{{ f.activeBudgetAlerts }}</span>
                    <span *ngIf="f.activeBudgetAlerts === 0" class="fo-ok-badge">✓</span>
                  </td>
                  <td><span class="fo-risk" [class]="'fo-risk-' + f.riskLevel?.toLowerCase()">{{ riskLabel(f.riskLevel) }}</span></td>
                  <td><i class="feather icon-chevron-right fo-chevron"></i></td>
                </tr>
                <tr *ngIf="top3Risk().length === 0">
                  <td colspan="7" class="fo-empty">Aucun agriculteur à risque.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ════════════ TAB 2 — DISTRIBUTION ════════════ -->
        <div *ngIf="activeTab() === 'distribution'">
          <div class="fo-section">
            <h6 class="fo-section-title">Répartition par niveau de santé financière</h6>
            <div class="fo-dist-grid">
              <ng-container *ngFor="let level of healthLevels">
                <div class="fo-dist-card">
                  <div class="fo-dist-header">
                    <span class="fo-badge" [class]="'fo-badge-' + level.key.toLowerCase()">{{ level.label }}</span>
                    <span class="fo-dist-count">{{ data()?.healthDistribution?.[level.key] ?? 0 }}</span>
                  </div>
                  <div class="fo-dist-bar-wrap">
                    <div class="fo-dist-bar" [style.width.%]="getPercent(level.key)" [class]="'fo-bar-' + level.key.toLowerCase()"></div>
                  </div>
                  <div class="fo-dist-pct">{{ getPercent(level.key) | number:'1.0-0' }}% des agriculteurs</div>
                  <div class="fo-dist-desc">{{ level.desc }}</div>
                </div>
              </ng-container>
            </div>
          </div>

          <div class="fo-section">
            <h6 class="fo-section-title">Scores individuels — cliquez pour détails</h6>
            <table class="fo-table">
              <thead>
                <tr><th>Agriculteur</th><th>Score</th><th>Niveau</th><th>Épargne nette/mois</th><th>Solde épargne</th><th></th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let f of data()?.farmers" class="fo-row-clickable" (click)="openDetail(f)">
                  <td>
                    <div class="fo-user-cell">
                      <div class="fo-avatar" [style.background]="getAvatarColor(f.healthScore)">{{ getInitials(f) }}</div>
                      <div>
                        <div class="fo-user-name">{{ f.firstName }} {{ f.lastName }}</div>
                        <div class="fo-user-email">{{ f.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="fo-score-cell">
                      <div class="fo-score-bar-wrap"><div class="fo-score-bar" [style.width.%]="f.healthScore" [class]="getScoreClass(f.healthScore)"></div></div>
                      <strong>{{ f.healthScore }}</strong>/100
                    </div>
                  </td>
                  <td><span class="fo-badge" [class]="'fo-badge-' + f.healthLevel?.toLowerCase()">{{ f.healthLevel }}</span></td>
                  <td class="fo-num" [class.fo-income]="f.monthlySavings >= 0" [class.fo-expense]="f.monthlySavings < 0">
                    {{ f.monthlySavings >= 0 ? '+' : '' }}{{ f.monthlySavings | number:'1.0-0' }} DT
                  </td>
                  <td class="fo-num">{{ f.savingsBalance | number:'1.0-0' }} DT</td>
                  <td><i class="feather icon-chevron-right fo-chevron"></i></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ════════════ TAB 3 — AGRICULTEURS ════════════ -->
        <div *ngIf="activeTab() === 'agriculteurs'">
          <div class="fo-filter-bar">
            <button class="fo-filter-btn" [class.fo-filter-btn--active]="filter() === 'all'"     (click)="filter.set('all')">
              Tous <span class="fo-filter-count">{{ data()?.farmers?.length }}</span>
            </button>
            <button class="fo-filter-btn" [class.fo-filter-btn--active]="filter() === 'risk'"    (click)="filter.set('risk')">
              À risque <span class="fo-filter-count fo-danger">{{ data()?.farmersAtRisk }}</span>
            </button>
            <button class="fo-filter-btn" [class.fo-filter-btn--active]="filter() === 'track'"   (click)="filter.set('track')">
              En forme <span class="fo-filter-count fo-success">{{ data()?.farmersOnTrack }}</span>
            </button>
            <button class="fo-filter-btn" [class.fo-filter-btn--active]="filter() === 'deficit'" (click)="filter.set('deficit')">
              En déficit <span class="fo-filter-count fo-danger">{{ data()?.farmersInDeficit }}</span>
            </button>
          </div>

          <div class="fo-farmer-list">
            <div class="fo-farmer-card fo-row-clickable" *ngFor="let f of filteredFarmers()"
                 [class.fo-farmer-card--critical]="f.riskLevel === 'HIGH'"
                 (click)="openDetail(f)">
              <div class="fo-farmer-header">
                <div class="fo-user-cell">
                  <div class="fo-avatar fo-avatar--lg" [style.background]="getAvatarColor(f.healthScore)">{{ getInitials(f) }}</div>
                  <div>
                    <div class="fo-user-name fo-user-name--lg">{{ f.firstName }} {{ f.lastName }}</div>
                    <div class="fo-user-email">{{ f.email }}</div>
                  </div>
                </div>
                <div class="fo-farmer-badges">
                  <span class="fo-badge" [class]="'fo-badge-' + f.healthLevel?.toLowerCase()">{{ f.healthLevel }}</span>
                  <span class="fo-risk-pill" [class]="'fo-risk-pill--' + f.riskLevel?.toLowerCase()">{{ riskLabel(f.riskLevel) }}</span>
                  <i class="feather icon-chevron-right fo-chevron fo-chevron--lg"></i>
                </div>
              </div>
              <div class="fo-farmer-score-row">
                <span class="fo-farmer-score-label">Score santé</span>
                <div class="fo-farmer-score-bar-wrap">
                  <div class="fo-farmer-score-bar" [style.width.%]="f.healthScore" [class]="getScoreClass(f.healthScore)"></div>
                </div>
                <span class="fo-farmer-score-val">{{ f.healthScore }}/100</span>
              </div>
              <div class="fo-farmer-kpis">
                <div class="fo-farmer-kpi">
                  <span class="fo-farmer-kpi-label">Revenu/mois</span>
                  <span class="fo-farmer-kpi-val fo-income">+{{ f.monthlyIncome | number:'1.0-0' }} DT</span>
                </div>
                <div class="fo-farmer-kpi">
                  <span class="fo-farmer-kpi-label">Dépenses/mois</span>
                  <span class="fo-farmer-kpi-val fo-expense">-{{ f.monthlyExpenses | number:'1.0-0' }} DT</span>
                </div>
                <div class="fo-farmer-kpi">
                  <span class="fo-farmer-kpi-label">Épargne nette</span>
                  <span class="fo-farmer-kpi-val" [class.fo-income]="f.monthlySavings >= 0" [class.fo-expense]="f.monthlySavings < 0">
                    {{ f.monthlySavings >= 0 ? '+' : '' }}{{ f.monthlySavings | number:'1.0-0' }} DT
                  </span>
                </div>
                <div class="fo-farmer-kpi">
                  <span class="fo-farmer-kpi-label">Solde épargne</span>
                  <span class="fo-farmer-kpi-val">{{ f.savingsBalance | number:'1.0-0' }} DT</span>
                </div>
              </div>
              <div class="fo-farmer-footer">
                <span *ngIf="f.activeBudgetAlerts > 0" class="fo-alert-badge">
                  <i class="feather icon-bell"></i> {{ f.activeBudgetAlerts }} alerte(s) active(s)
                </span>
                <span *ngIf="f.activeBudgetAlerts === 0" class="fo-ok-badge">
                  <i class="feather icon-check"></i> Aucune alerte active
                </span>
                <span class="fo-card-hint">Cliquez pour voir les détails →</span>
              </div>
            </div>
          </div>

          <div *ngIf="filteredFarmers().length === 0" class="fo-empty-state">
            <i class="feather icon-users"></i>
            <p>Aucun agriculteur dans cette catégorie.</p>
          </div>
        </div>
      </ng-container>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- DRAWER OVERLAY                                        -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div class="fo-drawer-overlay" [class.fo-drawer-overlay--open]="drawerOpen()" (click)="closeDetail()"></div>

    <div class="fo-drawer" [class.fo-drawer--open]="drawerOpen()">

      <!-- Drawer loading -->
      <div *ngIf="detailLoading()" class="fo-drawer-loading">
        <div class="fo-spinner"></div>
        <p>Chargement des détails...</p>
      </div>

      <ng-container *ngIf="!detailLoading() && detail()">
        <!-- Header -->
        <div class="fo-drawer-header">
          <div class="fo-user-cell">
            <div class="fo-avatar fo-avatar--xl" [style.background]="getAvatarColor(detail()!.healthScore)">
              {{ detail()!.firstName?.charAt(0) }}{{ detail()!.lastName?.charAt(0) }}
            </div>
            <div>
              <div class="fo-drawer-name">{{ detail()!.firstName }} {{ detail()!.lastName }}</div>
              <div class="fo-user-email">{{ detail()!.email }}</div>
            </div>
          </div>
          <button class="fo-drawer-close" (click)="closeDetail()">
            <i class="feather icon-x"></i>
          </button>
        </div>

        <!-- Drawer tabs -->
        <div class="fo-drawer-tabs">
          <button class="fo-dtab" [class.fo-dtab--active]="drawerTab() === 'finance'"   (click)="drawerTab.set('finance')">Finance</button>
          <button class="fo-dtab" [class.fo-dtab--active]="drawerTab() === 'epargne'"   (click)="drawerTab.set('epargne')">Épargne</button>
          <button class="fo-dtab" [class.fo-dtab--active]="drawerTab() === 'budgets'"   (click)="drawerTab.set('budgets')">Budgets</button>
          <button class="fo-dtab" [class.fo-dtab--active]="drawerTab() === 'historique'" (click)="drawerTab.set('historique')">Historique</button>
        </div>

        <div class="fo-drawer-body">

          <!-- ── Finance ── -->
          <div *ngIf="drawerTab() === 'finance'">
            <!-- Score -->
            <div class="fd-block">
              <div class="fd-block-title">Score de santé financière</div>
              <div class="fd-score-row">
                <div class="fd-score-num" [style.color]="getAvatarColor(detail()!.healthScore)">{{ detail()!.healthScore }}</div>
                <div class="fd-score-right">
                  <span class="fo-badge" [class]="'fo-badge-' + detail()!.healthLevel?.toLowerCase()">{{ detail()!.healthLevel }}</span>
                  <div class="fd-score-bar-wrap">
                    <div class="fd-score-bar" [style.width.%]="detail()!.healthScore" [class]="getScoreClass(detail()!.healthScore)"></div>
                  </div>
                  <span class="fo-risk-pill" [class]="'fo-risk-pill--' + detail()!.riskLevel?.toLowerCase()">{{ riskLabel(detail()!.riskLevel) }}</span>
                </div>
              </div>
            </div>

            <!-- Monthly KPIs -->
            <div class="fd-block">
              <div class="fd-block-title">Moyennes mensuelles (3 derniers mois)</div>
              <div class="fd-kpi-row">
                <div class="fd-kpi fd-kpi--income">
                  <span class="fd-kpi-label">Revenus</span>
                  <span class="fd-kpi-val">+{{ detail()!.monthlyIncome | number:'1.0-0' }} DT</span>
                </div>
                <div class="fd-kpi fd-kpi--expense">
                  <span class="fd-kpi-label">Dépenses</span>
                  <span class="fd-kpi-val">-{{ detail()!.monthlyExpenses | number:'1.0-0' }} DT</span>
                </div>
                <div class="fd-kpi" [class.fd-kpi--income]="detail()!.monthlySavings >= 0" [class.fd-kpi--expense]="detail()!.monthlySavings < 0">
                  <span class="fd-kpi-label">Épargne nette</span>
                  <span class="fd-kpi-val">{{ detail()!.monthlySavings >= 0 ? '+' : '' }}{{ detail()!.monthlySavings | number:'1.0-0' }} DT</span>
                </div>
              </div>
            </div>

            <!-- All-time totals -->
            <div class="fd-block">
              <div class="fd-block-title">Totaux cumulés (toutes périodes)</div>
              <div class="fd-kpi-row">
                <div class="fd-kpi fd-kpi--income">
                  <span class="fd-kpi-label">Total revenus</span>
                  <span class="fd-kpi-val">+{{ detail()!.totalIncome | number:'1.0-0' }} DT</span>
                </div>
                <div class="fd-kpi fd-kpi--expense">
                  <span class="fd-kpi-label">Total dépenses</span>
                  <span class="fd-kpi-val">-{{ detail()!.totalExpenses | number:'1.0-0' }} DT</span>
                </div>
              </div>
            </div>

            <!-- Monthly breakdown -->
            <div class="fd-block">
              <div class="fd-block-title">Évolution sur 6 mois</div>
              <div class="fd-month-list">
                <div class="fd-month-row" *ngFor="let m of detail()!.monthlyBreakdown">
                  <span class="fd-month-label">{{ m.month }}</span>
                  <div class="fd-month-bars">
                    <div class="fd-mbar fd-mbar--income" [style.width.%]="getMonthBarPct(m.income)" title="Revenus"></div>
                    <div class="fd-mbar fd-mbar--expense" [style.width.%]="getMonthBarPct(m.expenses)" title="Dépenses"></div>
                  </div>
                  <span class="fd-month-net" [class.fo-income]="m.net >= 0" [class.fo-expense]="m.net < 0">
                    {{ m.net >= 0 ? '+' : '' }}{{ m.net | number:'1.0-0' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Expenses by category -->
            <div class="fd-block" *ngIf="detail()!.expensesByCategory?.length">
              <div class="fd-block-title">Dépenses par catégorie</div>
              <div class="fd-cat-list">
                <div class="fd-cat-row" *ngFor="let c of detail()!.expensesByCategory">
                  <span class="fd-cat-label">{{ c.category }}</span>
                  <div class="fd-cat-bar-wrap">
                    <div class="fd-cat-bar" [style.width.%]="c.pct"></div>
                  </div>
                  <span class="fd-cat-pct">{{ c.pct | number:'1.0-0' }}%</span>
                  <span class="fd-cat-amt">{{ c.amount | number:'1.0-0' }} DT</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Épargne ── -->
          <div *ngIf="drawerTab() === 'epargne'">
            <div class="fd-block" *ngIf="detail()!.savingsAccountName; else noSavings">
              <div class="fd-block-title">Compte épargne</div>
              <div class="fd-savings-name">{{ detail()!.savingsAccountName }}</div>
              <div class="fd-savings-balance">{{ detail()!.savingsBalance | number:'1.0-0' }} DT</div>
              <div class="fd-savings-meta">Statut : <strong>{{ detail()!.savingsStatus }}</strong></div>

              <div *ngIf="detail()!.savingsGoalTitle" class="fd-goal-block">
                <div class="fd-block-title" style="margin-top:16px">Objectif d'épargne</div>
                <div class="fd-goal-title">{{ detail()!.savingsGoalTitle }}</div>
                <div class="fd-goal-amounts">
                  <span class="fo-income">{{ detail()!.savingsBalance | number:'1.0-0' }} DT</span>
                  <span class="fd-goal-sep">sur</span>
                  <span>{{ detail()!.savingsGoalAmount | number:'1.0-0' }} DT</span>
                </div>
                <div class="fd-goal-bar-wrap">
                  <div class="fd-goal-bar" [style.width.%]="detail()!.goalProgressPct ?? 0"></div>
                </div>
                <div class="fd-goal-pct">{{ detail()!.goalProgressPct | number:'1.0-0' }}% atteint</div>
              </div>

              <div *ngIf="detail()!.monthlySavingsTarget" class="fd-target-block">
                <div class="fd-block-title" style="margin-top:16px">Objectif mensuel</div>
                <div class="fd-kpi-row">
                  <div class="fd-kpi fd-kpi--neutral">
                    <span class="fd-kpi-label">Cible</span>
                    <span class="fd-kpi-val">{{ detail()!.monthlySavingsTarget | number:'1.0-0' }} DT</span>
                  </div>
                  <div class="fd-kpi" [class.fd-kpi--income]="detail()!.monthlySavings >= 0" [class.fd-kpi--expense]="detail()!.monthlySavings < 0">
                    <span class="fd-kpi-label">Réalisé/mois</span>
                    <span class="fd-kpi-val">{{ detail()!.monthlySavings | number:'1.0-0' }} DT</span>
                  </div>
                </div>
              </div>
            </div>
            <ng-template #noSavings>
              <div class="fo-empty-state"><i class="feather icon-credit-card"></i><p>Pas de compte épargne enregistré.</p></div>
            </ng-template>
          </div>

          <!-- ── Budgets ── -->
          <div *ngIf="drawerTab() === 'budgets'">
            <div class="fd-block" *ngIf="detail()!.activeBudgets?.length; else noBudgets">
              <div class="fd-block-title">Budgets actifs ({{ detail()!.activeBudgets!.length }})</div>
              <div class="fd-budget-list">
                <div class="fd-budget-row" *ngFor="let b of detail()!.activeBudgets"
                     [class.fd-budget-row--over]="b.overBudget">
                  <div class="fd-budget-top">
                    <span class="fd-budget-cat">{{ b.category }}</span>
                    <span *ngIf="b.overBudget" class="fo-alert-badge">Dépassé</span>
                    <span *ngIf="!b.overBudget" class="fo-ok-badge">OK</span>
                  </div>
                  <div class="fd-budget-period">{{ b.periodType }} · {{ b.periodStart }} → {{ b.periodEnd }}</div>
                  <div class="fd-budget-bar-wrap">
                    <div class="fd-budget-bar"
                         [style.width.%]="getBudgetPct(b)"
                         [class.fd-budget-bar--over]="b.overBudget">
                    </div>
                  </div>
                  <div class="fd-budget-nums">
                    <span class="fo-expense">{{ b.actualSpent | number:'1.0-0' }} DT dépensé</span>
                    <span>/ {{ b.plannedAmount | number:'1.0-0' }} DT prévu</span>
                    <span [class.fo-expense]="b.overBudget" [class.fo-income]="!b.overBudget">
                      ({{ b.overBudget ? '+' : '' }}{{ b.remaining | number:'1.0-0' }} DT)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <ng-template #noBudgets>
              <div class="fo-empty-state"><i class="feather icon-target"></i><p>Aucun budget actif.</p></div>
            </ng-template>
          </div>

          <!-- ── Historique ── -->
          <div *ngIf="drawerTab() === 'historique'">
            <div class="fd-block" *ngIf="detail()!.recentEntries?.length; else noEntries">
              <div class="fd-block-title">5 dernières opérations</div>
              <div class="fd-entry-list">
                <div class="fd-entry-row" *ngFor="let e of detail()!.recentEntries">
                  <div class="fd-entry-icon" [class.fd-entry-icon--income]="e.type === 'INCOME'" [class.fd-entry-icon--expense]="e.type === 'EXPENSE'">
                    <i [class]="e.type === 'INCOME' ? 'feather icon-arrow-up' : 'feather icon-arrow-down'"></i>
                  </div>
                  <div class="fd-entry-info">
                    <div class="fd-entry-desc">{{ e.description || e.category }}</div>
                    <div class="fd-entry-meta">{{ e.category }} · {{ e.date }}</div>
                  </div>
                  <div class="fd-entry-amount" [class.fo-income]="e.type === 'INCOME'" [class.fo-expense]="e.type === 'EXPENSE'">
                    {{ e.type === 'INCOME' ? '+' : '-' }}{{ e.amount | number:'1.0-0' }} DT
                  </div>
                </div>
              </div>
            </div>
            <ng-template #noEntries>
              <div class="fo-empty-state"><i class="feather icon-file-text"></i><p>Aucune opération enregistrée.</p></div>
            </ng-template>
          </div>

        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    /* ── Page ── */
    .fo-page { padding: 0 4px; }
    .fo-page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
    .fo-page-title  { font-size:1.3rem; font-weight:700; color:#1e293b; margin:0 0 4px; }
    .fo-page-sub    { font-size:0.85rem; color:#6b7280; margin:0; }
    .fo-refresh-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; border:1px solid #e5e7eb; border-radius:8px; background:#fff; color:#374151; font-size:0.82rem; cursor:pointer; transition:all .2s; }
    .fo-refresh-btn:hover { background:#f9fafb; border-color:#2e8b57; color:#2e8b57; }
    .fo-refresh-btn:disabled { opacity:.5; cursor:not-allowed; }
    @keyframes fo-spin { to { transform:rotate(360deg); } }
    .fo-spinning { animation:fo-spin .8s linear infinite; }

    /* ── Tabs ── */
    .fo-tabs { display:flex; gap:4px; border-bottom:2px solid #e5e7eb; margin-bottom:24px; }
    .fo-tab { display:flex; align-items:center; gap:6px; padding:10px 18px; border:none; background:none; color:#6b7280; font-size:.875rem; font-weight:500; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-2px; transition:all .2s; border-radius:6px 6px 0 0; }
    .fo-tab:hover { color:#2e8b57; background:#f0faf4; }
    .fo-tab--active { color:#2e8b57; border-bottom-color:#2e8b57; background:#f0faf4; }
    .fo-tab-badge { background:#2e8b57; color:#fff; border-radius:999px; padding:1px 7px; font-size:.7rem; font-weight:700; }

    /* ── Section ── */
    .fo-section { background:#fff; border-radius:12px; padding:24px; margin-bottom:20px; box-shadow:0 1px 4px rgba(0,0,0,.06); border:1px solid #f0f0f0; }
    .fo-section-title { font-size:.78rem; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:.07em; margin:0 0 20px; }

    /* ── KPI Grid ── */
    .fo-kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:16px; }
    .fo-kpi-card { background:#fff; border-radius:12px; padding:20px 22px; display:flex; align-items:center; gap:16px; box-shadow:0 1px 4px rgba(0,0,0,.06); border:1px solid #f0f0f0; border-left:4px solid transparent; }
    .fo-kpi-blue    { border-left-color:#4285f4; } .fo-kpi-green   { border-left-color:#34a853; }
    .fo-kpi-teal    { border-left-color:#00897b; } .fo-kpi-red     { border-left-color:#e53935; }
    .fo-kpi-orange  { border-left-color:#fb8c00; } .fo-kpi-emerald { border-left-color:#2e8b57; }
    .fo-kpi-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
    .fo-kpi-blue .fo-kpi-icon    { background:#e8f0fe; color:#4285f4; } .fo-kpi-green .fo-kpi-icon   { background:#e6f4ea; color:#34a853; }
    .fo-kpi-teal .fo-kpi-icon    { background:#e0f2f1; color:#00897b; } .fo-kpi-red .fo-kpi-icon     { background:#fce8e8; color:#e53935; }
    .fo-kpi-orange .fo-kpi-icon  { background:#fff3e0; color:#fb8c00; } .fo-kpi-emerald .fo-kpi-icon { background:#e8f5e9; color:#2e8b57; }
    .fo-kpi-body  { display:flex; flex-direction:column; }
    .fo-kpi-label { font-size:.72rem; color:#6b7280; text-transform:uppercase; letter-spacing:.06em; margin-bottom:2px; }
    .fo-kpi-val   { font-size:1.6rem; font-weight:800; color:#1e293b; line-height:1.2; }
    .fo-kpi-val small { font-size:.9rem; font-weight:400; color:#64748b; margin-left:3px; }
    .fo-kpi-hint  { font-size:.72rem; color:#9ca3af; margin-top:2px; }

    /* ── Distribution ── */
    .fo-dist-grid { display:flex; flex-direction:column; gap:14px; }
    .fo-dist-card { background:#f8fafc; border-radius:10px; padding:16px 20px; border:1px solid #e5e7eb; }
    .fo-dist-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
    .fo-dist-count  { font-size:1.5rem; font-weight:800; color:#1e293b; }
    .fo-dist-bar-wrap { height:12px; background:#e5e7eb; border-radius:999px; overflow:hidden; margin-bottom:8px; }
    .fo-dist-bar  { height:100%; border-radius:999px; transition:width .8s ease; min-width:4px; }
    .fo-dist-pct  { font-size:.8rem; color:#6b7280; font-weight:600; }
    .fo-dist-desc { font-size:.75rem; color:#9ca3af; margin-top:4px; }

    /* ── Table ── */
    .fo-table { width:100%; border-collapse:collapse; font-size:.85rem; }
    .fo-table th { padding:10px 14px; background:#f8fafc; color:#6b7280; font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; font-weight:600; text-align:left; border-bottom:1px solid #e5e7eb; }
    .fo-table td { padding:12px 14px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
    .fo-row-clickable { cursor:pointer; transition:background .15s; }
    .fo-row-clickable:hover { background:#f0faf4; }
    .fo-row-critical { background:#fff8f8; }
    .fo-chevron { color:#cbd5e1; font-size:.9rem; }
    .fo-chevron--lg { font-size:1.2rem; }

    /* ── Farmer cards ── */
    .fo-farmer-list { display:flex; flex-direction:column; gap:14px; }
    .fo-farmer-card { background:#fff; border-radius:14px; padding:22px 24px; box-shadow:0 1px 4px rgba(0,0,0,.06); border:1px solid #f0f0f0; transition:box-shadow .15s, transform .15s; }
    .fo-farmer-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.1); transform:translateY(-1px); }
    .fo-farmer-card--critical { border-left:4px solid #e53935; }
    .fo-farmer-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:8px; }
    .fo-farmer-badges { display:flex; gap:6px; align-items:center; }
    .fo-farmer-score-row { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
    .fo-farmer-score-label { font-size:.75rem; color:#6b7280; text-transform:uppercase; letter-spacing:.05em; white-space:nowrap; width:90px; }
    .fo-farmer-score-bar-wrap { flex:1; height:8px; background:#f1f5f9; border-radius:999px; overflow:hidden; }
    .fo-farmer-score-bar { height:100%; border-radius:999px; transition:width .6s; }
    .fo-farmer-score-val { font-size:.85rem; font-weight:700; color:#1e293b; white-space:nowrap; }
    .fo-farmer-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
    .fo-farmer-kpi { background:#f8fafc; border-radius:8px; padding:10px 12px; display:flex; flex-direction:column; gap:3px; }
    .fo-farmer-kpi-label { font-size:.7rem; color:#6b7280; text-transform:uppercase; letter-spacing:.05em; }
    .fo-farmer-kpi-val   { font-size:.95rem; font-weight:700; }
    .fo-farmer-footer { display:flex; align-items:center; justify-content:space-between; border-top:1px solid #f1f5f9; padding-top:12px; }
    .fo-card-hint { font-size:.75rem; color:#94a3b8; font-style:italic; }

    /* ── Filter bar ── */
    .fo-filter-bar { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
    .fo-filter-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; border:1px solid #e5e7eb; border-radius:20px; background:#fff; color:#374151; font-size:.82rem; cursor:pointer; transition:all .2s; }
    .fo-filter-btn:hover { border-color:#2e8b57; color:#2e8b57; }
    .fo-filter-btn--active { background:#2e8b57; color:#fff; border-color:#2e8b57; }
    .fo-filter-btn--active .fo-filter-count { color:rgba(255,255,255,.85); }
    .fo-filter-count { font-weight:700; font-size:.8rem; }

    /* ── Badges & pills ── */
    .fo-badge { padding:3px 10px; border-radius:999px; font-size:.7rem; font-weight:700; display:inline-block; white-space:nowrap; }
    .fo-badge-excellent { background:#d1fae5; color:#065f46; } .fo-badge-good     { background:#e6f4ea; color:#2e8b57; }
    .fo-badge-fair      { background:#fef3c7; color:#92400e; } .fo-badge-poor     { background:#ffedd5; color:#c2410c; }
    .fo-badge-critical  { background:#fee2e2; color:#b91c1c; }
    .fo-risk-pill { padding:3px 10px; border-radius:999px; font-size:.7rem; font-weight:700; display:inline-block; }
    .fo-risk-pill--high   { background:#fee2e2; color:#b91c1c; }
    .fo-risk-pill--medium { background:#fef3c7; color:#92400e; }
    .fo-risk-pill--low    { background:#d1fae5; color:#065f46; }

    /* ── Health bars ── */
    .fo-bar-excellent { background:#2e8b57; } .fo-bar-good     { background:#52b788; }
    .fo-bar-fair      { background:#f59e0b; } .fo-bar-poor     { background:#f97316; }
    .fo-bar-critical  { background:#e53935; }

    /* ── Score bars ── */
    .fo-score-cell { display:flex; align-items:center; gap:8px; }
    .fo-score-bar-wrap { width:60px; height:6px; background:#f1f5f9; border-radius:999px; overflow:hidden; }
    .fo-score-bar { height:100%; border-radius:999px; }
    .fo-score-high   { background:#2e8b57; } .fo-score-medium { background:#f59e0b; } .fo-score-low { background:#e53935; }

    /* ── User cell ── */
    .fo-user-cell { display:flex; align-items:center; gap:10px; }
    .fo-avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:700; color:#fff; flex-shrink:0; }
    .fo-avatar--lg  { width:44px; height:44px; font-size:.9rem; }
    .fo-avatar--xl  { width:52px; height:52px; font-size:1rem; }
    .fo-user-name   { font-weight:600; color:#1e293b; }
    .fo-user-name--lg { font-size:1rem; }
    .fo-user-email  { font-size:.75rem; color:#94a3b8; }

    /* ── Alert / ok badges ── */
    .fo-alert-badge { display:inline-flex; align-items:center; gap:5px; background:#fee2e2; color:#b91c1c; border-radius:999px; padding:4px 10px; font-size:.75rem; font-weight:700; }
    .fo-ok-badge    { display:inline-flex; align-items:center; gap:5px; background:#d1fae5; color:#065f46;  border-radius:999px; padding:4px 10px; font-size:.75rem; font-weight:700; }

    /* ── Colors ── */
    .fo-num { font-weight:600; }
    .fo-income  { color:#2e8b57; } .fo-expense { color:#e53935; }
    .fo-danger  { color:#e53935 !important; } .fo-success { color:#2e8b57 !important; }
    .fo-risk { font-size:.8rem; font-weight:700; }
    .fo-risk-high { color:#e53935; } .fo-risk-medium { color:#f59e0b; } .fo-risk-low { color:#2e8b57; }

    /* ── Empty states ── */
    .fo-empty { text-align:center; color:#94a3b8; padding:32px; }
    .fo-empty-state { display:flex; flex-direction:column; align-items:center; gap:12px; padding:48px; color:#94a3b8; font-size:.9rem; }
    .fo-empty-state i { font-size:2rem; }

    /* ── Loading / Error ── */
    .fo-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px; color:#64748b; gap:16px; }
    .fo-spinner { width:40px; height:40px; border:3px solid #e5e7eb; border-top-color:#2e8b57; border-radius:50%; animation:fo-spin .8s linear infinite; }
    .fo-error-box { display:flex; align-items:flex-start; gap:14px; background:#fff5f5; border:1px solid #fecaca; border-radius:10px; padding:20px 24px; color:#b91c1c; margin-bottom:20px; }
    .fo-error-box i { font-size:1.4rem; flex-shrink:0; } .fo-error-box p { margin:4px 0 0; font-size:.85rem; color:#dc2626; }
    .fo-error-box button { margin-left:auto; padding:8px 16px; background:#2e8b57; color:#fff; border:none; border-radius:6px; cursor:pointer; white-space:nowrap; }

    /* ════════════════════════════════════════════════
       DRAWER
    ════════════════════════════════════════════════ */
    .fo-drawer-overlay { position:fixed; inset:0; background:rgba(0,0,0,0); pointer-events:none; transition:background .3s; z-index:1040; }
    .fo-drawer-overlay--open { background:rgba(0,0,0,.35); pointer-events:all; }

    .fo-drawer {
      position:fixed; top:0; right:0; height:100vh; width:480px; max-width:100vw;
      background:#fff; box-shadow:-4px 0 30px rgba(0,0,0,.15);
      transform:translateX(100%); transition:transform .3s cubic-bezier(.4,0,.2,1);
      z-index:1050; display:flex; flex-direction:column; overflow:hidden;
    }
    .fo-drawer--open { transform:translateX(0); }

    .fo-drawer-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:20px 24px; border-bottom:1px solid #f0f0f0; background:#f8fafc; flex-shrink:0;
    }
    .fo-drawer-name { font-size:1.05rem; font-weight:700; color:#1e293b; }
    .fo-drawer-close { width:32px; height:32px; border:none; background:#e5e7eb; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:1.1rem; color:#374151; transition:all .2s; flex-shrink:0; }
    .fo-drawer-close:hover { background:#d1d5db; }

    .fo-drawer-tabs { display:flex; border-bottom:1px solid #e5e7eb; background:#fff; flex-shrink:0; }
    .fo-dtab { flex:1; padding:12px 6px; border:none; background:none; color:#6b7280; font-size:.8rem; font-weight:600; cursor:pointer; border-bottom:2px solid transparent; transition:all .2s; text-align:center; }
    .fo-dtab:hover { color:#2e8b57; }
    .fo-dtab--active { color:#2e8b57; border-bottom-color:#2e8b57; background:#f0faf4; }

    .fo-drawer-body { flex:1; overflow-y:auto; padding:20px 24px; }

    .fo-drawer-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; height:200px; gap:16px; color:#64748b; }

    /* ── Drawer content blocks ── */
    .fd-block { margin-bottom:24px; }
    .fd-block-title { font-size:.72rem; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:.07em; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #f1f5f9; }

    .fd-score-row { display:flex; align-items:center; gap:16px; }
    .fd-score-num { font-size:3rem; font-weight:900; line-height:1; }
    .fd-score-right { flex:1; display:flex; flex-direction:column; gap:8px; }
    .fd-score-bar-wrap { height:10px; background:#f1f5f9; border-radius:999px; overflow:hidden; }
    .fd-score-bar { height:100%; border-radius:999px; transition:width .6s; }

    .fd-kpi-row { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
    .fd-kpi { border-radius:10px; padding:12px 14px; display:flex; flex-direction:column; gap:4px; }
    .fd-kpi-label { font-size:.7rem; color:#6b7280; text-transform:uppercase; letter-spacing:.05em; }
    .fd-kpi-val   { font-size:1rem; font-weight:700; }
    .fd-kpi--income  { background:#f0faf4; } .fd-kpi--income  .fd-kpi-val { color:#2e8b57; }
    .fd-kpi--expense { background:#fff5f5; } .fd-kpi--expense .fd-kpi-val { color:#e53935; }
    .fd-kpi--neutral { background:#f8fafc; } .fd-kpi--neutral .fd-kpi-val { color:#1e293b; }

    /* Monthly breakdown mini bars */
    .fd-month-list { display:flex; flex-direction:column; gap:8px; }
    .fd-month-row { display:flex; align-items:center; gap:10px; }
    .fd-month-label { font-size:.75rem; color:#6b7280; width:62px; flex-shrink:0; }
    .fd-month-bars { flex:1; display:flex; flex-direction:column; gap:3px; }
    .fd-mbar { height:5px; border-radius:999px; max-width:100%; min-width:2px; }
    .fd-mbar--income  { background:#2e8b57; }
    .fd-mbar--expense { background:#e53935; }
    .fd-month-net { font-size:.75rem; font-weight:700; width:70px; text-align:right; flex-shrink:0; }

    /* Category bars */
    .fd-cat-list { display:flex; flex-direction:column; gap:10px; }
    .fd-cat-row { display:flex; align-items:center; gap:10px; }
    .fd-cat-label { font-size:.75rem; color:#374151; width:100px; flex-shrink:0; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .fd-cat-bar-wrap { flex:1; height:8px; background:#f1f5f9; border-radius:999px; overflow:hidden; }
    .fd-cat-bar { height:100%; background:#e53935; border-radius:999px; transition:width .6s; }
    .fd-cat-pct { font-size:.75rem; color:#6b7280; width:32px; text-align:right; flex-shrink:0; }
    .fd-cat-amt { font-size:.75rem; color:#374151; font-weight:600; width:80px; text-align:right; flex-shrink:0; }

    /* Savings */
    .fd-savings-name    { font-size:1rem; font-weight:600; color:#1e293b; margin-bottom:4px; }
    .fd-savings-balance { font-size:2rem; font-weight:800; color:#2e8b57; margin-bottom:8px; }
    .fd-savings-meta    { font-size:.8rem; color:#6b7280; }
    .fd-goal-title      { font-size:.9rem; font-weight:600; color:#374151; margin-bottom:8px; }
    .fd-goal-amounts    { display:flex; align-items:center; gap:6px; font-size:.85rem; margin-bottom:8px; }
    .fd-goal-sep        { color:#9ca3af; }
    .fd-goal-bar-wrap   { height:10px; background:#e5e7eb; border-radius:999px; overflow:hidden; margin-bottom:6px; }
    .fd-goal-bar        { height:100%; background:#2e8b57; border-radius:999px; transition:width .8s; }
    .fd-goal-pct        { font-size:.8rem; color:#2e8b57; font-weight:600; }

    /* Budget rows */
    .fd-budget-list { display:flex; flex-direction:column; gap:14px; }
    .fd-budget-row { background:#f8fafc; border-radius:10px; padding:14px 16px; border:1px solid #e5e7eb; }
    .fd-budget-row--over { background:#fff5f5; border-color:#fecaca; }
    .fd-budget-top  { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
    .fd-budget-cat  { font-weight:700; color:#1e293b; font-size:.9rem; }
    .fd-budget-period { font-size:.72rem; color:#9ca3af; margin-bottom:8px; }
    .fd-budget-bar-wrap { height:8px; background:#e5e7eb; border-radius:999px; overflow:hidden; margin-bottom:8px; }
    .fd-budget-bar { height:100%; background:#2e8b57; border-radius:999px; transition:width .6s; max-width:100%; }
    .fd-budget-bar--over { background:#e53935; }
    .fd-budget-nums { display:flex; gap:8px; font-size:.78rem; flex-wrap:wrap; }

    /* Entry rows */
    .fd-entry-list { display:flex; flex-direction:column; gap:12px; }
    .fd-entry-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #f1f5f9; }
    .fd-entry-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:.9rem; flex-shrink:0; }
    .fd-entry-icon--income  { background:#e6f4ea; color:#2e8b57; }
    .fd-entry-icon--expense { background:#fee2e2; color:#e53935; }
    .fd-entry-info { flex:1; }
    .fd-entry-desc { font-size:.85rem; font-weight:600; color:#1e293b; }
    .fd-entry-meta { font-size:.72rem; color:#94a3b8; margin-top:2px; }
    .fd-entry-amount { font-weight:700; font-size:.9rem; white-space:nowrap; }

    /* ── Responsive ── */
    @media (max-width:900px) { .fo-kpi-grid { grid-template-columns:repeat(2,1fr); } .fo-farmer-kpis { grid-template-columns:repeat(2,1fr); } .fd-kpi-row { grid-template-columns:repeat(2,1fr); } }
    @media (max-width:600px) { .fo-kpi-grid { grid-template-columns:1fr; } .fo-drawer { width:100vw; } }
  `]
})
export class FinancialOverviewComponent implements OnInit {
  private svc = inject(AdminFinancialService);

  data      = signal<any>(null);
  loading   = signal(true);
  error     = signal('');
  filter    = signal<'all' | 'risk' | 'track' | 'deficit'>('all');
  activeTab = signal<Tab>('synthese');

  // Drawer
  drawerOpen    = signal(false);
  detail        = signal<any>(null);
  detailLoading = signal(false);
  drawerTab     = signal<'finance' | 'epargne' | 'budgets' | 'historique'>('finance');

  healthLevels = [
    { key: 'EXCELLENT', label: 'Excellent', desc: 'Santé financière optimale, épargne croissante' },
    { key: 'GOOD',      label: 'Good',      desc: 'Bonne gestion, légères améliorations possibles' },
    { key: 'FAIR',      label: 'Fair',      desc: 'Situation acceptable, à surveiller de près' },
    { key: 'POOR',      label: 'Poor',      desc: 'Difficultés financières, intervention recommandée' },
    { key: 'CRITICAL',  label: 'Critical',  desc: 'Situation critique, action urgente nécessaire' },
  ];

  filteredFarmers = computed(() => {
    const farmers: any[] = this.data()?.farmers ?? [];
    if (this.filter() === 'risk')    return farmers.filter(f => f.healthScore < 35);
    if (this.filter() === 'track')   return farmers.filter(f => f.healthScore >= 65);
    if (this.filter() === 'deficit') return farmers.filter(f => f.monthlySavings < 0);
    return farmers;
  });

  top3Risk = computed(() => (this.data()?.farmers ?? []).slice(0, 3));

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.svc.getFinancialOverview().subscribe({
      next: d  => { this.data.set(d); this.loading.set(false); },
      error: e => { this.error.set(`Erreur ${e.status}: ${e.message}`); this.loading.set(false); }
    });
  }

  openDetail(farmer: any) {
    this.drawerOpen.set(true);
    this.detail.set(null);
    this.detailLoading.set(true);
    this.drawerTab.set('finance');
    this.svc.getFarmerDetail(farmer.userId).subscribe({
      next: d  => { this.detail.set(d); this.detailLoading.set(false); },
      error: () => { this.detailLoading.set(false); }
    });
  }

  closeDetail() {
    this.drawerOpen.set(false);
  }

  getPercent(level: string): number {
    const total = this.data()?.totalFarmers ?? 0;
    if (!total) return 0;
    return ((this.data()?.healthDistribution?.[level] ?? 0) / total) * 100;
  }

  getMonthBarPct(amount: number): number {
    if (!this.detail()) return 0;
    const maxIncome = Math.max(...(this.detail()!.monthlyBreakdown ?? []).map((m: any) => Math.max(m.income, m.expenses, 1)));
    return Math.min((amount / maxIncome) * 100, 100);
  }

  getBudgetPct(b: any): number {
    if (!b.plannedAmount || b.plannedAmount === 0) return 0;
    return Math.min((b.actualSpent / b.plannedAmount) * 100, 100);
  }

  getInitials(f: any): string {
    return `${f.firstName?.charAt(0) ?? ''}${f.lastName?.charAt(0) ?? ''}`.toUpperCase();
  }

  getAvatarColor(score: number): string {
    if (score >= 65) return '#2e8b57';
    if (score >= 35) return '#f59e0b';
    return '#e53935';
  }

  getScoreClass(score: number): string {
    if (score >= 65) return 'fo-score-high';
    if (score >= 35) return 'fo-score-medium';
    return 'fo-score-low';
  }

  riskLabel(level: string): string {
    if (level === 'HIGH')   return '● Risque Élevé';
    if (level === 'MEDIUM') return '● Risque Moyen';
    return '● Risque Faible';
  }
}

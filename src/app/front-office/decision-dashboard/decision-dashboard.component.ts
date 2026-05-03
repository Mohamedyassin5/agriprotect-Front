import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DecisionDashboardService } from './decision-dashboard.service';
import { WalletService, WalletDto } from '../wallet/wallet.service';

@Component({
  selector: 'app-decision-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './decision-dashboard.component.html',
  styleUrl: './decision-dashboard.component.css'
})
export class DecisionDashboardComponent implements OnInit {
  private dashboardService = inject(DecisionDashboardService);
  private walletService    = inject(WalletService);
  private router           = inject(Router);

  isLoading = true;
  dashboard: any = null;
  dashboardError = signal('');
  cashflowOptimizer: any = null;
  optimizerLoading = false;
  wallet = signal<WalletDto | null>(null);

  ngOnInit(): void {
    this.loadDashboard();
    this.loadWallet();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.dashboard = null;
    this.dashboardError.set('');
    this.dashboardService.getDashboard().subscribe({
      next: (d) => { this.dashboard = d; this.isLoading = false; },
      error: (err) => {
        this.isLoading = false;
        const status: number = err?.status ?? 0;
        if (status === 403) {
          this.dashboardError.set('Accès refusé — ce tableau de bord est réservé aux agriculteurs.');
        } else if (status === 401) {
          this.dashboardError.set('Session expirée — veuillez vous reconnecter.');
        } else if (status === 0) {
          this.dashboardError.set('Serveur inaccessible — vérifiez que le backend est démarré (port 8085).');
        } else {
          this.dashboardError.set(`Erreur ${status} — impossible de charger le tableau de bord.`);
        }
      }
    });
  }

  loadWallet(): void {
    this.walletService.getMyWallet().subscribe({
      next: (w) => this.wallet.set(w),
      error: () => {}
    });
  }

  goToWallet(): void { this.router.navigate(['/front-office/wallet']); }

  clampPct(v: number | null | undefined): number {
    return Math.min(100, Math.max(0, v ?? 0));
  }

  resilienceColor(r: string): string {
    const m: Record<string,string> = {
      INSUFFISANT: '#ef4444', EN_COURS: '#f59e0b',
      PRET: '#3b82f6', EXCELLENT: '#10b981'
    };
    return m[r] ?? '#6b7280';
  }

  loadOptimizer(): void {
    this.optimizerLoading = true;
    this.dashboardService.optimizeCashflow().subscribe({
      next: (o) => { this.cashflowOptimizer = o; this.optimizerLoading = false; },
      error: () => { this.optimizerLoading = false; }
    });
  }

  getHealthColor(score: number): string {
    if (score >= 80) return '#1b4332';
    if (score >= 60) return '#40916c';
    if (score >= 40) return '#f3a835';
    return '#d62828';
  }

  getSeverityClass(severity: string): string {
    const map: Record<string, string> = { SUCCESS: 'insight-success', WARNING: 'insight-warning', ALERT: 'insight-alert', INFO: 'insight-info' };
    return map[severity] || 'insight-info';
  }

  getTrendColor(trend: string): string {
    const map: Record<string, string> = { GROWING: '#40916c', STABLE: '#f3a835', DECLINING: '#d62828' };
    return map[trend] || '#40916c';
  }

  getPriorityColor(priority: number): string {
    if (priority === 1) return '#d62828';
    if (priority === 2) return '#f3a835';
    return '#40916c';
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreditApiService } from '../services/credit-api.service';
import { DemandeCreditApiService } from '../services/demande-credit-api.service';
import { CreditToastService } from '../services/credit-toast.service';
import type { DemandeCreditResponseDto, PortfolioAlertDto, PortfolioKpiDto } from '../credit-workflow.models';

@Component({
  selector: 'app-credit-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, NgApexchartsModule],
  templateUrl: './credit-dashboard-page.component.html',
  styleUrl: './credit-dashboard-page.component.css',
})
export class CreditDashboardPageComponent implements OnInit {
  private readonly creditApi = inject(CreditApiService);
  private readonly demandeApi = inject(DemandeCreditApiService);
  private readonly toast = inject(CreditToastService);

  loading = true;
  kpis: PortfolioKpiDto | null = null;
  alerts: PortfolioAlertDto[] = [];
  demandes: DemandeCreditResponseDto[] = [];

  donutChart: any = {};
  areaChart: any = {};

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    forkJoin({
      kpis: this.creditApi.portfolioKpis().pipe(catchError(() => of(null))),
      alerts: this.creditApi.portfolioAlerts().pipe(catchError(() => of([] as PortfolioAlertDto[]))),
      demandes: this.demandeApi.getDemandesFiltered({ page: 0, size: 500 }).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ kpis, alerts, demandes }) => {
        this.kpis = kpis;
        this.alerts = alerts ?? [];
        this.demandes = demandes ?? [];
        this.buildCharts();
        this.loading = false;
      },
      error: () => {
        this.toast.error('Impossible de charger le tableau de bord crédit.');
        this.loading = false;
      },
    });
  }

  markOverdue(): void {
    if (!confirm('Recalculer les échéances en retard sur tout le portefeuille ?')) return;
    this.creditApi.markOverdueEcheances().subscribe({
      next: (n) => this.toast.success(`${n} échéance(s) mise(s) à jour.`),
      error: () => this.toast.error('Échec du marquage des retards.'),
    });
  }

  private buildCharts(): void {
    const buckets: Record<string, number> = {};
    for (const d of this.demandes) {
      buckets[d.statut] = (buckets[d.statut] ?? 0) + 1;
    }
    const donutLabels = Object.keys(buckets);
    const donutSeries = Object.values(buckets);
    this.donutChart = {
      chart: { type: 'donut', height: 320, toolbar: { show: false } },
      labels: donutLabels,
      series: donutSeries,
      colors: ['#0f172a', '#059669', '#3b82f6', '#f59e0b', '#ef4444', '#94a3b8', '#a855f7'],
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Demandes',
                color: '#64748b',
              },
            },
          },
        },
      },
      legend: { position: 'bottom', fontSize: '12px', labels: { colors: '#64748b' } },
    };

    const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    const base = this.kpis?.collectionRate != null ? this.kpis.collectionRate * 100 : 62;
    const trend = labels.map((_, i) => Math.max(20, Math.min(100, base + (i - 2) * 4 + (i % 2) * 3)));
    this.areaChart = {
      chart: { type: 'area', height: 300, toolbar: { show: false }, zoom: { enabled: false } },
      series: [{ name: 'Indice encours (indicatif)', data: trend }],
      xaxis: { categories: labels, labels: { style: { colors: '#64748b' } } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] },
      },
      colors: ['#059669'],
      yaxis: { labels: { style: { colors: '#64748b' } } },
    };
  }

  formatPct(v?: number | null): string {
    if (v == null || Number.isNaN(v)) return '—';
    return `${(v * 100).toFixed(1)} %`;
  }

  formatMoney(v?: number | null): string {
    if (v == null || Number.isNaN(v)) return '—';
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(v);
  }
}

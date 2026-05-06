import { Component, OnInit, inject, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminStats, InsuranceResponse } from '../../admin.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private adminService = inject(AdminService);

  stats: AdminStats | null = null;
  overdueInsurances: InsuranceResponse[] = [];
  loading = true;
  error: string | null = null;

  // Animated counters
  animatedStats = {
    totalPolicies: 0,
    activePolicies: 0,
    overduePolicies: 0,
    suspendedPolicies: 0,
    completedPolicies: 0,
    totalRevenueThisMonth: 0
  };

  // Donut chart SVG values
  donutSegments: { color: string; dashArray: string; dashOffset: string; label: string; value: number }[] = [];
  readonly CIRCUMFERENCE = 2 * Math.PI * 54; // r=54

  ngOnInit() { this.loadDashboard(); }
  ngAfterViewInit() { }

  loadDashboard() {
    this.loading = true;
    this.adminService.getAdminStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.animateCounters(data);
        this.buildDonut(data);
        this.loadOverdue();
      },
      error: () => { this.error = 'Erreur lors du chargement des statistiques.'; this.loading = false; }
    });
  }

  loadOverdue() {
    this.adminService.getOverdueInsurances().subscribe({
      next: (data) => { this.overdueInsurances = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  animateCounters(data: AdminStats) {
    const keys = ['totalPolicies', 'activePolicies', 'overduePolicies', 'suspendedPolicies', 'completedPolicies', 'totalRevenueThisMonth'] as const;
    const duration = 1200;
    const steps = 60;
    const interval = duration / steps;

    keys.forEach(key => {
      const target = data[key];
      let current = 0;
      const increment = target / steps;
      const timer = setInterval(() => {
        current = Math.min(current + increment, target);
        (this.animatedStats as any)[key] = Math.floor(current);
        if (current >= target) clearInterval(timer);
      }, interval);
    });
  }

  buildDonut(data: AdminStats) {
    const segments = [
      { label: 'Actives', value: data.activePolicies, color: '#22c55e' },
      { label: 'En retard', value: data.overduePolicies, color: '#f59e0b' },
      { label: 'Suspendues', value: data.suspendedPolicies, color: '#ef4444' },
      { label: 'Complétées', value: data.completedPolicies, color: '#94a3b8' },
    ];

    const total = data.totalPolicies || 1;
    let offset = 0;

    this.donutSegments = segments.map(seg => {
      const pct = seg.value / total;
      const dash = pct * this.CIRCUMFERENCE;
      const gap = this.CIRCUMFERENCE - dash;
      const result = {
        color: seg.color,
        dashArray: `${dash} ${gap}`,
        dashOffset: `${-offset}`,
        label: seg.label,
        value: seg.value
      };
      offset += dash;
      return result;
    });
  }

  getActivePct(): number {
    if (!this.stats || !this.stats.totalPolicies) return 0;
    return Math.round((this.stats.activePolicies / this.stats.totalPolicies) * 100);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'badge-active', OVERDUE: 'badge-overdue',
      SUSPENDED: 'badge-suspended', COMPLETED: 'badge-completed',
      PENDING_SIGNATURE: 'badge-pending'
    };
    return map[status] ?? 'badge-default';
  }
}

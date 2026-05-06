import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AccountingEntry {
  id: number;
  entryType: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  description: string;
  entryDate: string;
}

export interface Budget {
  id: number;
  periodType: 'MONTHLY' | 'SEASONAL' | 'YEARLY';
  periodStart: string;
  periodEnd: string;
  category: string;
  plannedAmount: number;
}

export const ENTRY_CATEGORIES = [
  'SALES', 'SEEDS', 'FERTILIZER', 'IRRIGATION',
  'LABOR', 'TRANSPORT', 'EQUIPMENT', 'INSURANCE',
  'LOAN_PAYMENT', 'OTHER'
];

@Injectable({ providedIn: 'root' })
export class AccountingService {
  private http = inject(HttpClient);
  private base = environment.savingsApiUrl;

  // Entries
  addEntry(data: any): Observable<AccountingEntry> {
    return this.http.post<AccountingEntry>(`${this.base}/api/accounting/entries`, data);
  }
  getEntries(params?: any): Observable<AccountingEntry[]> {
    return this.http.get<any>(`${this.base}/api/accounting/entries`, { params }).pipe(
      map(r => Array.isArray(r) ? r : (r?.content ?? []))
    );
  }
  getEntry(id: number): Observable<AccountingEntry> {
    return this.http.get<AccountingEntry>(`${this.base}/api/accounting/entries/${id}`);
  }
  updateEntry(id: number, data: any): Observable<AccountingEntry> {
    return this.http.put<AccountingEntry>(`${this.base}/api/accounting/entries/${id}`, data);
  }
  deleteEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/accounting/entries/${id}`);
  }

  // Budgets
  createBudget(data: any): Observable<Budget> {
    return this.http.post<Budget>(`${this.base}/api/accounting/budgets`, data);
  }
  getBudgets(params?: any): Observable<Budget[]> {
    return this.http.get<any>(`${this.base}/api/accounting/budgets`, { params }).pipe(
      map(r => Array.isArray(r) ? r : (r?.content ?? []))
    );
  }
  getBudget(id: number): Observable<Budget> {
    return this.http.get<Budget>(`${this.base}/api/accounting/budgets/${id}`);
  }
  updateBudget(id: number, data: any): Observable<Budget> {
    return this.http.put<Budget>(`${this.base}/api/accounting/budgets/${id}`, data);
  }
  deleteBudget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/accounting/budgets/${id}`);
  }

  // Analytics
  getSummary(from: string, to: string): Observable<any> {
    return this.http.get(`${this.base}/api/accounting/summary`, { params: { from, to } });
  }
  getBudgetVsActual(periodStart: string, periodEnd: string): Observable<any> {
    return this.http.get(`${this.base}/api/accounting/budget-vs-actual`, { params: { periodStart, periodEnd } });
  }
  getSpendingBreakdown(from: string, to: string): Observable<any> {
    return this.http.get(`${this.base}/api/accounting/spending-breakdown`, { params: { from, to } });
  }
  getCashflowForecast(): Observable<any> {
    return this.http.get(`${this.base}/api/accounting/cashflow/forecast`);
  }
  getOverspendingAlerts(periodStart: string, periodEnd: string): Observable<any> {
    return this.http.get(`${this.base}/api/accounting/alerts/overspending`, { params: { periodStart, periodEnd } });
  }
  getAnomalies(from: string, to: string): Observable<any> {
    return this.http.get(`${this.base}/api/accounting/anomalies`, { params: { from, to } });
  }
}

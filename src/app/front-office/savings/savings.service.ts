import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SavingsAccount {
  id: number;
  userId: string;
  accountName: string;
  currentBalance: number;
  monthlySavingsTarget: number;
  goalAmount: number | null;
  goalTitle: string | null;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface SavingsTransaction {
  id: number;
  accountId: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  description: string;
  occurredAt: string;
}

export interface SavingsGoal {
  id: string;
  savingsAccountId: number;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  targetDate: string;
  description: string;
  achieved: boolean;
  progressPercentage: number;
  priority: number;
  customAllocationPercentage: number | null;
  allocationMode: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class SavingsService {
  private http = inject(HttpClient);
  private base = environment.savingsApiUrl;

  // Account
  createAccount(data: { accountName: string; monthlySavingsTarget: number }): Observable<SavingsAccount> {
    return this.http.post<SavingsAccount>(`${this.base}/api/savings/accounts`, data);
  }
  getMyAccount(): Observable<SavingsAccount> {
    return this.http.get<SavingsAccount>(`${this.base}/api/savings/accounts/me`);
  }
  updateAccount(data: any): Observable<SavingsAccount> {
    return this.http.put<SavingsAccount>(`${this.base}/api/savings/accounts/me`, data);
  }

  // Transactions
  addTransaction(data: { type: string; amount: number; description: string }): Observable<SavingsTransaction> {
    return this.http.post<SavingsTransaction>(`${this.base}/api/savings/transactions`, data);
  }
  getTransactions(type?: string): Observable<SavingsTransaction[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get<any>(`${this.base}/api/savings/transactions`, { params }).pipe(
      map(r => Array.isArray(r) ? r : (r?.content ?? []))
    );
  }
  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/savings/transactions/${id}`);
  }

  // Goals
  createGoal(data: any): Observable<SavingsGoal> {
    return this.http.post<SavingsGoal>(`${this.base}/api/savings/goals`, data);
  }
  getGoals(achieved?: boolean): Observable<SavingsGoal[]> {
    let params = new HttpParams();
    if (achieved !== undefined) params = params.set('achieved', String(achieved));
    return this.http.get<any>(`${this.base}/api/savings/goals`, { params }).pipe(
      map(r => Array.isArray(r) ? r : (r?.content ?? []))
    );
  }
  updateGoal(id: string, data: any): Observable<SavingsGoal> {
    return this.http.put<SavingsGoal>(`${this.base}/api/savings/goals/${id}`, data);
  }
  deleteGoal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/savings/goals/${id}`);
  }
  setGoalPriority(id: string, data: any): Observable<SavingsGoal> {
    return this.http.patch<SavingsGoal>(`${this.base}/api/savings/goals/${id}/priority`, data);
  }
  collectGoal(id: string): Observable<SavingsGoal> {
    return this.http.post<SavingsGoal>(`${this.base}/api/savings/goals/${id}/collect`, {});
  }
  getArchivedGoals(): Observable<SavingsGoal[]> {
    return this.http.get<SavingsGoal[]>(`${this.base}/api/savings/goals/archive`);
  }

  // Analytics
  getGoalProgress(): Observable<any> {
    return this.http.get(`${this.base}/api/savings/accounts/goal/progress`);
  }
  getMonthlySummary(months = 6): Observable<any> {
    return this.http.get(`${this.base}/api/savings/accounts/summary/monthly`, { params: { months } });
  }
  getAlerts(): Observable<any> {
    return this.http.get(`${this.base}/api/savings/accounts/alerts`);
  }
  simulateWithdrawal(amount: number): Observable<any> {
    return this.http.post(`${this.base}/api/savings/accounts/simulate/withdraw`, { amount });
  }
  getRecommendation(): Observable<any> {
    return this.http.get(`${this.base}/api/savings/accounts/recommendation`);
  }
  getStatement(from: string, to: string): Observable<any> {
    return this.http.get(`${this.base}/api/savings/accounts/statement`, { params: { from, to } });
  }
}

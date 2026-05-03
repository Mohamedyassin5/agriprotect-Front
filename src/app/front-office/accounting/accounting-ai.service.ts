import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AccountingAIService {
  private http = inject(HttpClient);
  private base = environment.savingsApiUrl;

  getHealthScore(): Observable<any> {
    return this.http.get(`${this.base}/api/ai/accounting/health-score`);
  }
  forecastExpenses(months = 3): Observable<any> {
    return this.http.get(`${this.base}/api/ai/accounting/forecast/expenses`, { params: { months } });
  }
  simulateWhatIf(data: { categoryChanges: Record<string, number>; incomeChangePercent: number; simulationMonths: number }): Observable<any> {
    return this.http.post(`${this.base}/api/ai/accounting/simulate/what-if`, data);
  }
  getProfitabilityTrends(months = 6): Observable<any> {
    return this.http.get(`${this.base}/api/ai/accounting/trends/profitability`, { params: { months } });
  }
  categorizeTransaction(description: string): Observable<any> {
    return this.http.post(`${this.base}/api/ai/accounting/categorize`, { description });
  }
  getPredictiveBudgetAlerts(): Observable<any> {
    return this.http.get(`${this.base}/api/ai/accounting/budget/predictive-alerts`);
  }
  predictFinancialRisk(data: {
    revenue: number; expenses: number; debtToEquity: number; netProfit: number;
    avgTemperature: number; rainfall: number; droughtIndex: number; floodRiskScore: number;
  }): Observable<any> {
    return this.http.post(`${this.base}/api/ai/accounting/ml/risk-predict`, data);
  }
}

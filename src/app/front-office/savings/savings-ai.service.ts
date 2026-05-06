import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SavingsAIService {
  private http = inject(HttpClient);
  private base = environment.savingsApiUrl;

  predictGoalAchievement(): Observable<any> {
    return this.http.get(`${this.base}/api/ai/savings/goal/predict-achievement`);
  }
  getSmartPlan(): Observable<any> {
    return this.http.get(`${this.base}/api/ai/savings/plan/smart`);
  }
  assessWithdrawalRisk(amount: number): Observable<any> {
    return this.http.post(`${this.base}/api/ai/savings/withdrawal/risk-assessment`, { amount });
  }
  getEmergencyFund(): Observable<any> {
    return this.http.get(`${this.base}/api/ai/savings/emergency-fund`);
  }
  predictSavingsAlert(data: {
    revenue: number; expenses: number; loanAmount: number;
    droughtIndex: number; floodRiskScore: number; policySupportScore: number;
  }): Observable<any> {
    return this.http.post(`${this.base}/api/ai/savings/ml/savings-alert`, data);
  }
}

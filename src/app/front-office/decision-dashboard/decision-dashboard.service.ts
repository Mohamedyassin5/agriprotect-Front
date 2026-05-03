import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DecisionDashboardService {
  private http = inject(HttpClient);
  private base = environment.savingsApiUrl;

  getDashboard(): Observable<any> {
    return this.http.get(`${this.base}/api/ai/dashboard`);
  }
  optimizeCashflow(): Observable<any> {
    return this.http.get(`${this.base}/api/ai/dashboard/optimize-cashflow`);
  }
}

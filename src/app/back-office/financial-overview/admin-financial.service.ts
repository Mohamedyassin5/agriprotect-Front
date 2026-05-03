import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminFinancialService {
  private http = inject(HttpClient);
  private base = environment.savingsApiUrl;

  getFinancialOverview(): Observable<any> {
    return this.http.get(`${this.base}/api/admin/financial/overview`);
  }

  getFarmerDetail(userId: string): Observable<any> {
    return this.http.get(`${this.base}/api/admin/financial/farmer/${userId}`);
  }
}

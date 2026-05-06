import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface QcmQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer?: string; // Often hidden from farmer until submitted
}

export interface QcmTest {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  requiredScore: number;
  discountPercentage: number;
  questions: QcmQuestion[];
  fund?: any;
}

@Injectable({
  providedIn: 'root'
})
export class QcmService {
  private apiUrl = 'http://localhost:8081/api/qcm';

  constructor(private http: HttpClient) {}

  // Farmer endpoints
  getAvailableTests(): Observable<QcmTest[]> {
    return this.http.get<QcmTest[]>(`${this.apiUrl}/available`);
  }

  getTestQuestions(testId: string, limit: number = 5): Observable<QcmQuestion[]> {
    return this.http.get<QcmQuestion[]>(`${this.apiUrl}/${testId}/questions?limit=${limit}`);
  }

  submitTest(testId: string, answers: { [questionId: string]: string }): Observable<string> {
    return this.http.post(`${this.apiUrl}/${testId}/submit`, answers, { responseType: 'text' });
  }

  getMyResults(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-results`);
  }

  // Admin endpoints
  createTest(test: QcmTest): Observable<QcmTest> {
    return this.http.post<QcmTest>(this.apiUrl, test);
  }

  generateTestForFund(fundId: string): Observable<QcmTest> {
    return this.http.post<QcmTest>(`${this.apiUrl}/generate/${fundId}`, {});
  }
}

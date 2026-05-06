import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface TestResult {
  testName: string;
  status: 'success' | 'error' | 'loading' | 'idle';
  message: string;
  timestamp?: string;
}

@Component({
  selector: 'app-scheduler-tests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scheduler-tests.component.html',
  styleUrl: './scheduler-tests.component.css'
})
export class SchedulerTestsComponent {
  private http = inject(HttpClient);
  private base = '/agri/phase1';  // ✅ préfixe correct

  insuranceId = '';

  results: Record<string, TestResult> = {
    reminder2days: { testName: 'Rappel 2 jours',      status: 'idle', message: '' },
    penalty7days:  { testName: 'Pénalité 7 jours',    status: 'idle', message: '' },
    suspend15days: { testName: 'Suspension 15 jours',  status: 'idle', message: '' },
    runReminder:   { testName: 'Forcer Scheduler',     status: 'idle', message: '' },
  };

  get hasInsuranceId(): boolean {
    return this.insuranceId.trim().length > 0;
  }

  runTest(key: string, url: string) {
    this.results[key] = { ...this.results[key], status: 'loading', message: '' };
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (msg) => {
        this.results[key] = {
          ...this.results[key],
          status: 'success',
          message: msg,
          timestamp: new Date().toLocaleTimeString('fr-FR')
        };
      },
      error: (err) => {
        this.results[key] = {
          ...this.results[key],
          status: 'error',
          message: err?.error || 'Erreur inconnue.',
          timestamp: new Date().toLocaleTimeString('fr-FR')
        };
      }
    });
  }

  testReminder2Days() { this.runTest('reminder2days', `${this.base}/reminder/2days/${this.insuranceId.trim()}`); }
  testPenalty7Days()  { this.runTest('penalty7days',  `${this.base}/penalty/7days/${this.insuranceId.trim()}`); }
  testSuspend15Days() { this.runTest('suspend15days', `${this.base}/suspend/15days/${this.insuranceId.trim()}`); }
  runSchedulerNow()   { this.runTest('runReminder',   `${this.base}/run-reminder`); }

  resetAll() {
    Object.keys(this.results).forEach(k => {
      this.results[k] = { ...this.results[k], status: 'idle', message: '', timestamp: undefined };
    });
    this.insuranceId = '';
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface WalletDto {
  id: number;
  userId: string;
  availableBalance: number;
  emergencyFundBalance: number;
  totalBalance: number;
  status: string;
  emergencyTargetAmount: number;
  emergencyMonthlyContribution: number;
  emergencyAutoContribute: boolean;
  emergencyContributionDay: number;
  emergencyProgressPct: number;
  emergencyResilienceLevel: string; // INSUFFISANT | EN_COURS | PRET | EXCELLENT
  createdAt: string;
}

export interface WalletTransactionDto {
  id: number;
  type: string;
  amount: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string;
  referenceType: string;
  createdAt: string;
}

export interface EmergencyWithdrawalDto {
  id: number;
  walletUserId: string;
  walletUserName: string;
  amount: number;
  reason: string;
  description: string;
  status: string;
  adminNote: string;
  createdAt: string;
}

const BASE = 'http://localhost:8081/api/wallet';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private http = inject(HttpClient);

  getMyWallet(): Observable<WalletDto> {
    return this.http.get<WalletDto>(`${BASE}`);
  }

  deposit(body: { amount: number; description: string }): Observable<WalletDto> {
    return this.http.post<WalletDto>(`${BASE}/deposit`, body);
  }

  withdraw(body: { amount: number; description: string }): Observable<WalletDto> {
    return this.http.post<WalletDto>(`${BASE}/withdraw`, body);
  }

  transfer(body: { recipientEmail: string; amount: number; description: string }): Observable<WalletDto> {
    return this.http.post<WalletDto>(`${BASE}/transfer`, body);
  }

  configureEmergency(body: {
    targetAmount: number;
    monthlyContribution: number;
    autoContribute: boolean;
    contributionDay: number;
  }): Observable<WalletDto> {
    return this.http.put<WalletDto>(`${BASE}/emergency/config`, body);
  }

  topUpEmergency(body: { amount: number }): Observable<WalletDto> {
    return this.http.post<WalletDto>(`${BASE}/emergency/topup`, body);
  }

  requestEmergencyWithdrawal(body: {
    amount: number;
    reason: string;
    description: string;
  }): Observable<EmergencyWithdrawalDto> {
    return this.http.post<EmergencyWithdrawalDto>(`${BASE}/emergency/withdraw`, body);
  }

  getTransactions(page = 0): Observable<WalletTransactionDto[]> {
    const params = new HttpParams().set('page', page).set('size', 20);
    return this.http.get<any>(`${BASE}/transactions`, { params }).pipe(
      map(r => Array.isArray(r) ? r : (r?.content ?? []))
    );
  }

  getMyWithdrawals(): Observable<EmergencyWithdrawalDto[]> {
    return this.http.get<EmergencyWithdrawalDto[]>(`${BASE}/emergency/withdrawals`);
  }
}

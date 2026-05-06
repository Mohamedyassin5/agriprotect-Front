import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  weatherDescription: string;
  timestamp: string;
}

export interface Risk {
  id: string;
  cropId: string;
  cropType: string;
  userId?: string;
  userEmail?: string;
  riskType: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedAt: string;
  resolvedAt?: string;
  isResolved: boolean;
  currentValue: number;
}

export interface RiskCheckResponse {
  statusMessage: string;
  currentWeather: WeatherData;
  detectedRisks: Risk[];
}

@Injectable({
  providedIn: 'root'
})
export class RisqueService {
  private apiUrl = 'http://localhost:8081/agri/risques';

  constructor(private http: HttpClient) {}

  checkRisksForCrop(cropId: string): Observable<RiskCheckResponse> {
    return this.http.post<RiskCheckResponse>(`${this.apiUrl}/check/${cropId}`, {});
  }

  getMyRisks(): Observable<Risk[]> {
    return this.http.get<Risk[]>(`${this.apiUrl}/my-risques`);
  }

  getUnresolvedRisks(): Observable<Risk[]> {
    return this.http.get<Risk[]>(`${this.apiUrl}/unresolved/all`);
  }

  resolveRisk(riskId: string): Observable<Risk> {
    return this.http.put<Risk>(`${this.apiUrl}/${riskId}/resolve`, {});
  }

  getWeatherForCrop(cropId: string): Observable<WeatherData> {
    return this.http.get<WeatherData>(`${this.apiUrl}/weather/crop/${cropId}`);
  }
}

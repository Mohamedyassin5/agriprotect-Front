import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Crop {
  id?: string;
  cropType: string;
  surface: number;
  optimalHumidity: number;
  minHumidity: number;
  maxHumidity: number;
  minTemperature: number;
  maxTemperature: number;
  averageTemperature: number;
  startDate: string;
  endDate: string;
  typeterres: string;
  estimatedValue?: number;
  createdAt?: string;
  user?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CropService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/crops`;

  getUserCrops(userId: string): Observable<Crop[]> {
    return this.http.get<Crop[]>(`${this.apiUrl}/user/${userId}`);
  }

  addCrop(userId: string, crop: Crop): Observable<Crop> {
    return this.http.post<Crop>(`${this.apiUrl}/user/${userId}`, crop);
  }

  deleteCrop(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAllCrops(): Observable<Crop[]> {
    return this.http.get<Crop[]>(this.apiUrl);
  }

  estimateCropValue(id: string): Observable<Crop> {
    return this.http.post<Crop>(`${this.apiUrl}/${id}/estimate-value`, {});
  }
}

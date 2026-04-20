import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface CropAiRequest {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
  Soil_Fertility_Index: number;
  model?: string;
  top_k?: number;
}

export interface CropAiResponse {
  recommended_crops: string[];
  model_used: string;
}

@Injectable({
  providedIn: 'root'
})
export class CropAiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/crops`;

  getRecommendation(data: CropAiRequest): Observable<CropAiResponse> {
    return this.http.post<CropAiResponse>(`${this.apiUrl}/recommend`, data);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatRequest {
  message: string;
  history?: MessageHistory[];
}

export interface MessageHistory {
  role: string;
  content: string;
}

export interface ChatResponse {
  answer: string;
  model: string;
  tokensUsed: number;
}

@Injectable({
  providedIn: 'root'
})
export class AssistantService {
  private apiUrl = `${environment.apiUrl}/assistant/chat`;

  constructor(private http: HttpClient) {}

  chat(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.apiUrl, request);
  }
}

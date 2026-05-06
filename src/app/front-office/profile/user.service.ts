import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  currentUserProfile = signal<any>(null);

  // Helper to load and set signal
  loadProfile() {
    this.getMyProfile().subscribe(user => this.currentUserProfile.set(user));
  }

  // Backend reads the JWT and returns the current user — no email parsing needed
  getMyProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/me`);
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  updateProfile(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, data);
  }

  getUserById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  toggleUserStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${id}/status`, { status }, { responseType: 'text' });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  changePassword(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/me/password`, data, { responseType: 'text' });
  }

  enrollFace(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.apiUrl}/auth/face/enroll`, formData, { responseType: 'text' });
  }

  uploadProfileImage(userId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.apiUrl}/users/${userId}/profile-image`, formData);
  }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials);
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, userData);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email }, { responseType: 'text' });
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, data, { responseType: 'text' });
  }

  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Liberal check: As long as it's a 3-part string, we let the user in.
    // The Interceptor will handle the actual validation failure if it's expired.
    return token.split('.').length === 3;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return true; // Assume expired if no exp field
      
      const expiry = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      return expiry < now;
    } catch (e) {
      return true;
    }
  }

  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      let base64Url = parts[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if needed
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }

      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Token decoding failed', e);
      return null;
    }
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    
    const payload = this.decodeToken(token);
    if (!payload) return null;
    
    console.log('Decoded JWT Payload:', payload); // Debugging line

    let extractedRole = '';

    // Check various common Spring Boot JWT claim structures
    if (payload.role) {
      extractedRole = String(payload.role);
    } else if (payload.roles) {
      if (Array.isArray(payload.roles) && payload.roles.length > 0) {
        extractedRole = String(payload.roles[0].authority || payload.roles[0]);
      } else {
        extractedRole = String(payload.roles);
      }
    } else if (payload.authorities) {
      if (Array.isArray(payload.authorities) && payload.authorities.length > 0) {
        extractedRole = String(payload.authorities[0].authority || payload.authorities[0]);
      } else {
        extractedRole = String(payload.authorities);
      }
    }

    if (!extractedRole) return null;
    
    // Normalizing the role format
    extractedRole = extractedRole.toUpperCase().replace('ROLE_', '').trim();
    return extractedRole;
  }

  getUserFullName(): string {
    const token = this.getToken();
    if (!token) return 'Guest';
    
    const payload = this.decodeToken(token);
    if (!payload) return 'Guest';
    
    const firstName = payload.firstName || '';
    const lastName = payload.lastName || '';
    
    let fullName = `${firstName} ${lastName}`.trim();
    
    if (!fullName && payload.sub) {
      // Logic: mohamedyassin.rezgui@esprit.tn -> Mohamed Yassin Rezgui
      const handle = payload.sub.split('@')[0];
      fullName = handle
        .split(/[._\d]/) // Split by dots, underscores, or digits
        .filter((part: string) => part.length > 0)
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }
    
    return fullName || 'User';
  }

  getUserEmail(): string {
    const token = this.getToken();
    if (!token) return '';
    const payload = this.decodeToken(token);
    return payload ? payload.sub || '' : '';
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodeToken(token);
    return payload ? payload.userId || null : null;
  }


  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/auth/login']);
  }
}

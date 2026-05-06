import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MarketplaceService {
  private http = inject(HttpClient);
  private base = 'http://localhost:8081/api/marketplace';
  private adminBase = 'http://localhost:8081/api/admin/marketplace';

  // Browse
  search(params: any): Observable<any> {
    let p = new HttpParams();
    if (params.category) p = p.set('category', params.category);
    if (params.type) p = p.set('type', params.type);
    if (params.minPrice != null) p = p.set('minPrice', params.minPrice);
    if (params.maxPrice != null) p = p.set('maxPrice', params.maxPrice);
    if (params.search) p = p.set('search', params.search);
    p = p.set('page', params.page ?? 0).set('size', params.size ?? 12);
    return this.http.get(this.base, { params: p });
  }

  getListing(id: number): Observable<any> {
    return this.http.get(`${this.base}/${id}`);
  }

  getReviews(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/${id}/reviews`);
  }

  // Seller
  createListing(body: any): Observable<any> {
    return this.http.post(`${this.base}/listings`, body);
  }

  updateListing(id: number, body: any): Observable<any> {
    return this.http.put(`${this.base}/listings/${id}`, body);
  }

  closeListing(id: number): Observable<any> {
    return this.http.delete(`${this.base}/listings/${id}`);
  }

  getMyListings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/my-listings`);
  }

  // Orders
  placeOrder(body: any): Observable<any> {
    return this.http.post(`${this.base}/orders`, body);
  }

  getMyOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/my-orders`);
  }

  getMySales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/my-sales`);
  }

  updateOrderStatus(orderId: number, req: { status: string; note?: string; location?: string; estimatedDelivery?: string }): Observable<any> {
    return this.http.patch(`${this.base}/orders/${orderId}/status`, req);
  }

  // Reviews
  addReview(body: any): Observable<any> {
    return this.http.post(`${this.base}/reviews`, body);
  }

  // Admin
  adminOverview(): Observable<any> {
    return this.http.get(`${this.adminBase}/overview`);
  }

  getPending(): Observable<any[]> {
    return this.http.get<any[]>(`${this.adminBase}/pending`);
  }

  approveListing(id: number, note: string): Observable<any> {
    return this.http.post(`${this.adminBase}/listings/${id}/approve`, null, { params: { note } });
  }

  rejectListing(id: number, note: string): Observable<any> {
    return this.http.post(`${this.adminBase}/listings/${id}/reject`, null, { params: { note } });
  }

  adminAllOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.adminBase}/orders`);
  }
}

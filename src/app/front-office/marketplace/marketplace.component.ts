import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MarketplaceService } from './marketplace.service';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="mp-page">
      <!-- Hero -->
      <div class="mp-hero">
        <div class="mp-hero-content">
          <h2 class="mp-hero-title">Marketplace AgriProtect</h2>
          <p class="mp-hero-sub">Achetez, vendez et échangez des produits et services agricoles</p>
          <div class="mp-search-bar">
            <input class="mp-search-input" [(ngModel)]="searchTerm" placeholder="Rechercher semences, équipements, services..." (keyup.enter)="doSearch()">
            <button class="mp-search-btn" (click)="doSearch()">
              <i class="feather icon-search"></i> Rechercher
            </button>
          </div>
        </div>
      </div>

      <div class="mp-body">
        <!-- Filters sidebar -->
        <aside class="mp-filters">
          <h6 class="mp-filter-title">Filtres</h6>

          <div class="mp-filter-group">
            <label class="mp-filter-label">Catégorie</label>
            <select class="mp-filter-select" [(ngModel)]="filters.category" (change)="doSearch()">
              <option value="">Toutes</option>
              <option *ngFor="let c of categories" [value]="c.value">{{ c.label }}</option>
            </select>
          </div>

          <div class="mp-filter-group">
            <label class="mp-filter-label">Type</label>
            <div class="mp-filter-radio-group">
              <label class="mp-filter-radio"><input type="radio" [(ngModel)]="filters.type" value="" (change)="doSearch()"> Tous</label>
              <label class="mp-filter-radio"><input type="radio" [(ngModel)]="filters.type" value="SALE" (change)="doSearch()"> Vente</label>
              <label class="mp-filter-radio"><input type="radio" [(ngModel)]="filters.type" value="RENT" (change)="doSearch()"> Location</label>
              <label class="mp-filter-radio"><input type="radio" [(ngModel)]="filters.type" value="SERVICE" (change)="doSearch()"> Service</label>
            </div>
          </div>

          <div class="mp-filter-group">
            <label class="mp-filter-label">Prix (DT)</label>
            <div class="mp-price-range">
              <input class="mp-price-input" type="number" [(ngModel)]="filters.minPrice" placeholder="Min" (change)="doSearch()">
              <span>–</span>
              <input class="mp-price-input" type="number" [(ngModel)]="filters.maxPrice" placeholder="Max" (change)="doSearch()">
            </div>
          </div>

          <button class="mp-reset-btn" (click)="resetFilters()">Réinitialiser</button>

          <div class="mp-publish-box">
            <p>Vous avez quelque chose à vendre ?</p>
            <a routerLink="/front-office/marketplace/publish" class="mp-publish-btn">
              <i class="feather icon-plus"></i> Publier une annonce
            </a>
          </div>

          <div class="mp-my-links">
            <a routerLink="/front-office/marketplace/my-listings" class="mp-my-link"><i class="feather icon-list"></i> Mes annonces</a>
            <a routerLink="/front-office/marketplace/my-orders" class="mp-my-link"><i class="feather icon-shopping-bag"></i> Mes commandes</a>
          </div>
        </aside>

        <!-- Listings grid -->
        <main class="mp-main">
          <div class="mp-results-bar" *ngIf="result()">
            <span class="mp-results-count">{{ result()?.totalElements ?? 0 }} annonce(s) trouvée(s)</span>
            <div class="mp-sort">
              <select class="mp-filter-select" style="width:auto">
                <option>Les plus récents</option>
              </select>
            </div>
          </div>

          <div *ngIf="loading()" class="mp-loading">
            <div class="mp-spinner"></div>
            <p>Chargement...</p>
          </div>

          <div class="mp-grid" *ngIf="!loading() && listings().length > 0">
            <div class="mp-card" *ngFor="let l of listings()" (click)="openListing(l)">
              <div class="mp-card-img">
                <img *ngIf="l.images?.length" [src]="l.images[0]" [alt]="l.title" class="mp-img">
                <div *ngIf="!l.images?.length" class="mp-img-placeholder">
                  <i class="feather icon-image"></i>
                </div>
                <span class="mp-type-badge mp-type-badge--{{l.type?.toLowerCase()}}">{{ typeLabel(l.type) }}</span>
              </div>
              <div class="mp-card-body">
                <span class="mp-cat-badge">{{ catLabel(l.category) }}</span>
                <h4 class="mp-card-title">{{ l.title }}</h4>
                <p class="mp-card-desc">{{ l.description | slice:0:80 }}{{ l.description?.length > 80 ? '...' : '' }}</p>
                <div class="mp-card-meta">
                  <span class="mp-card-location" *ngIf="l.location"><i class="feather icon-map-pin"></i> {{ l.location }}</span>
                  <span class="mp-card-seller"><i class="feather icon-user"></i> {{ l.sellerName }}</span>
                </div>
                <div class="mp-card-footer">
                  <div class="mp-card-price">
                    <span class="mp-price">{{ l.price | number:'1.0-0' }} DT</span>
                    <span class="mp-unit" *ngIf="l.unit">/ {{ l.unit }}</span>
                  </div>
                  <div class="mp-card-rating" *ngIf="l.reviewCount > 0">
                    <i class="feather icon-star"></i>
                    {{ l.averageRating | number:'1.1-1' }} ({{ l.reviewCount }})
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="!loading() && listings().length === 0" class="mp-empty">
            <i class="feather icon-inbox"></i>
            <p>Aucune annonce trouvée. Essayez d'autres filtres.</p>
          </div>

          <!-- Pagination -->
          <div class="mp-pagination" *ngIf="result() && result()?.totalPages > 1">
            <button class="mp-page-btn" [disabled]="currentPage() === 0" (click)="goPage(currentPage() - 1)">‹</button>
            <span class="mp-page-info">{{ currentPage() + 1 }} / {{ result()?.totalPages }}</span>
            <button class="mp-page-btn" [disabled]="currentPage() >= result()?.totalPages - 1" (click)="goPage(currentPage() + 1)">›</button>
          </div>
        </main>
      </div>

      <!-- Listing detail modal -->
      <div class="mp-modal-overlay" *ngIf="selectedListing()" (click)="closeListing()">
        <div class="mp-modal" (click)="$event.stopPropagation()" *ngIf="selectedListing() as l">
          <button class="mp-modal-close" (click)="closeListing()"><i class="feather icon-x"></i></button>
          <div class="mp-modal-img">
            <img *ngIf="l.images?.length" [src]="l.images[0]" [alt]="l.title">
            <div *ngIf="!l.images?.length" class="mp-modal-img-placeholder"><i class="feather icon-image"></i></div>
          </div>
          <div class="mp-modal-body">
            <div class="mp-modal-badges">
              <span class="mp-type-badge mp-type-badge--{{l.type?.toLowerCase()}}">{{ typeLabel(l.type) }}</span>
              <span class="mp-cat-badge">{{ catLabel(l.category) }}</span>
            </div>
            <h3 class="mp-modal-title">{{ l.title }}</h3>
            <div class="mp-modal-price">{{ l.price | number:'1.0-0' }} DT <span *ngIf="l.unit">/ {{ l.unit }}</span></div>
            <p class="mp-modal-desc">{{ l.description }}</p>
            <div class="mp-modal-meta">
              <div><i class="feather icon-user"></i> {{ l.sellerName }}</div>
              <div *ngIf="l.location"><i class="feather icon-map-pin"></i> {{ l.location }}</div>
              <div><i class="feather icon-package"></i> Stock: {{ l.stock }}</div>
              <div *ngIf="l.reviewCount > 0"><i class="feather icon-star"></i> {{ l.averageRating | number:'1.1-1' }}/5 ({{ l.reviewCount }} avis)</div>
            </div>

            <!-- Order form -->
            <div class="mp-order-form" *ngIf="!orderSuccess()">
              <div class="mp-form-row">
                <label>Quantité</label>
                <input type="number" class="mp-form-input" [(ngModel)]="orderQty" min="1" [max]="l.stock">
              </div>
              <div class="mp-form-row">
                <label>Adresse de livraison</label>
                <input type="text" class="mp-form-input" [(ngModel)]="orderAddress" placeholder="Votre adresse">
              </div>
              <div class="mp-form-row">
                <label>Notes</label>
                <input type="text" class="mp-form-input" [(ngModel)]="orderNotes" placeholder="Instructions particulières...">
              </div>
              <div class="mp-order-total">
                Total : <strong>{{ (l.price * orderQty) | number:'1.0-0' }} DT</strong>
              </div>
              <button class="mp-order-btn" (click)="placeOrder(l)" [disabled]="orderLoading()">
                <i class="feather icon-shopping-cart"></i>
                {{ orderLoading() ? 'Traitement...' : 'Commander maintenant' }}
              </button>
              <p *ngIf="orderError()" class="mp-order-error">{{ orderError() }}</p>
            </div>
            <div class="mp-order-success" *ngIf="orderSuccess()">
              <i class="feather icon-check-circle"></i>
              <p>Commande passée avec succès !</p>
              <button class="mp-btn-outline" (click)="closeListing()">Fermer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mp-page { min-height: 100vh; background: #f8fafc; }

    /* Hero */
    .mp-hero { background: linear-gradient(135deg, #1b4332 0%, #2e8b57 100%); padding: 48px 32px; text-align: center; }
    .mp-hero-title { color: #fff; font-size: 1.8rem; font-weight: 800; margin: 0 0 8px; }
    .mp-hero-sub { color: rgba(255,255,255,.75); font-size: 1rem; margin: 0 0 24px; }
    .mp-search-bar { display: flex; gap: 0; max-width: 600px; margin: 0 auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.2); }
    .mp-search-input { flex: 1; padding: 14px 18px; border: none; font-size: .95rem; outline: none; }
    .mp-search-btn { padding: 14px 24px; background: #52b788; color: #fff; border: none; font-size: .9rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .mp-search-btn:hover { background: #40916c; }

    /* Body layout */
    .mp-body { display: flex; gap: 24px; padding: 24px; max-width: 1400px; margin: 0 auto; }

    /* Filters */
    .mp-filters { width: 240px; flex-shrink: 0; }
    .mp-filter-title { font-size: .75rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: .07em; margin: 0 0 16px; }
    .mp-filter-group { margin-bottom: 20px; }
    .mp-filter-label { display: block; font-size: .75rem; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 8px; font-weight: 600; }
    .mp-filter-select { width: 100%; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: .85rem; background: #fff; }
    .mp-filter-radio-group { display: flex; flex-direction: column; gap: 6px; }
    .mp-filter-radio { display: flex; align-items: center; gap: 8px; font-size: .85rem; color: #374151; cursor: pointer; }
    .mp-price-range { display: flex; align-items: center; gap: 8px; }
    .mp-price-input { flex: 1; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: .82rem; }
    .mp-reset-btn { width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; color: #6b7280; font-size: .82rem; cursor: pointer; margin-bottom: 20px; }
    .mp-reset-btn:hover { background: #f9fafb; }
    .mp-publish-box { background: linear-gradient(135deg, #f0faf4, #e8f5e9); border: 1px solid #a7f3d0; border-radius: 10px; padding: 16px; text-align: center; margin-bottom: 12px; }
    .mp-publish-box p { font-size: .8rem; color: #374151; margin: 0 0 10px; }
    .mp-publish-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #2e8b57; color: #fff; border-radius: 8px; font-size: .82rem; font-weight: 600; text-decoration: none; }
    .mp-publish-btn:hover { background: #1b7a47; color: #fff; }
    .mp-my-links { display: flex; flex-direction: column; gap: 8px; }
    .mp-my-link { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; font-size: .83rem; color: #374151; text-decoration: none; }
    .mp-my-link:hover { border-color: #2e8b57; color: #2e8b57; }

    /* Main */
    .mp-main { flex: 1; min-width: 0; }
    .mp-results-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .mp-results-count { font-size: .85rem; color: #6b7280; }

    /* Grid */
    .mp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .mp-card { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.06); border: 1px solid #f0f0f0; cursor: pointer; transition: all .2s; }
    .mp-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.12); }
    .mp-card-img { position: relative; height: 180px; background: #f8fafc; overflow: hidden; }
    .mp-img { width: 100%; height: 100%; object-fit: cover; }
    .mp-img-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; color: #d1d5db; font-size: 2.5rem; }
    .mp-type-badge { position: absolute; top: 10px; left: 10px; padding: 3px 10px; border-radius: 999px; font-size: .7rem; font-weight: 700; }
    .mp-type-badge--sale    { background: #d1fae5; color: #065f46; }
    .mp-type-badge--rent    { background: #dbeafe; color: #1e40af; }
    .mp-type-badge--service { background: #ede9fe; color: #5b21b6; }
    .mp-card-body { padding: 16px; }
    .mp-cat-badge { display: inline-block; padding: 2px 8px; background: #f3f4f6; color: #374151; border-radius: 999px; font-size: .68rem; font-weight: 600; margin-bottom: 8px; }
    .mp-card-title { font-size: .95rem; font-weight: 700; color: #1e293b; margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mp-card-desc { font-size: .78rem; color: #6b7280; margin: 0 0 10px; line-height: 1.4; }
    .mp-card-meta { display: flex; gap: 12px; font-size: .72rem; color: #94a3b8; margin-bottom: 10px; flex-wrap: wrap; }
    .mp-card-footer { display: flex; align-items: center; justify-content: space-between; }
    .mp-price { font-size: 1.05rem; font-weight: 800; color: #2e8b57; }
    .mp-unit { font-size: .75rem; color: #6b7280; }
    .mp-card-rating { font-size: .75rem; color: #f59e0b; font-weight: 600; }

    /* Loading / empty */
    .mp-loading { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #64748b; gap: 14px; }
    .mp-spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #2e8b57; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .mp-empty { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #94a3b8; gap: 12px; }
    .mp-empty i { font-size: 2.5rem; }

    /* Pagination */
    .mp-pagination { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 24px; }
    .mp-page-btn { padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; cursor: pointer; font-size: 1rem; }
    .mp-page-btn:disabled { opacity: .4; cursor: not-allowed; }
    .mp-page-info { font-size: .85rem; color: #6b7280; }

    /* Modal */
    .mp-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .mp-modal { background: #fff; border-radius: 16px; max-width: 680px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; display: flex; flex-direction: column; }
    .mp-modal-close { position: absolute; top: 12px; right: 12px; background: #e5e7eb; border: none; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 1; }
    .mp-modal-img { height: 220px; overflow: hidden; border-radius: 16px 16px 0 0; }
    .mp-modal-img img { width: 100%; height: 100%; object-fit: cover; }
    .mp-modal-img-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; background: #f8fafc; color: #d1d5db; font-size: 3rem; }
    .mp-modal-body { padding: 24px; }
    .mp-modal-badges { display: flex; gap: 8px; margin-bottom: 10px; }
    .mp-modal-title { font-size: 1.3rem; font-weight: 800; color: #1e293b; margin: 0 0 8px; }
    .mp-modal-price { font-size: 1.4rem; font-weight: 800; color: #2e8b57; margin-bottom: 12px; }
    .mp-modal-desc { font-size: .9rem; color: #374151; line-height: 1.6; margin-bottom: 16px; }
    .mp-modal-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: .82rem; color: #6b7280; margin-bottom: 20px; }
    .mp-modal-meta div { display: flex; align-items: center; gap: 5px; }
    .mp-order-form { border-top: 1px solid #f0f0f0; padding-top: 20px; }
    .mp-form-row { margin-bottom: 14px; }
    .mp-form-row label { display: block; font-size: .75rem; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; font-weight: 600; }
    .mp-form-input { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: .9rem; }
    .mp-order-total { font-size: 1rem; color: #1e293b; margin-bottom: 16px; }
    .mp-order-btn { width: 100%; padding: 14px; background: #2e8b57; color: #fff; border: none; border-radius: 10px; font-size: .95rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .mp-order-btn:hover { background: #1b7a47; }
    .mp-order-btn:disabled { opacity: .6; cursor: not-allowed; }
    .mp-order-error { color: #e53935; font-size: .82rem; margin-top: 8px; text-align: center; }
    .mp-order-success { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 32px 0; color: #2e8b57; text-align: center; }
    .mp-order-success i { font-size: 2.5rem; }
    .mp-btn-outline { padding: 10px 24px; border: 2px solid #2e8b57; color: #2e8b57; background: none; border-radius: 8px; cursor: pointer; font-weight: 600; }

    @media (max-width: 768px) { .mp-body { flex-direction: column; } .mp-filters { width: 100%; } }
  `]
})
export class MarketplaceComponent implements OnInit {
  private svc = inject(MarketplaceService);

  result = signal<any>(null);
  listings = signal<any[]>([]);
  loading = signal(false);
  currentPage = signal(0);
  selectedListing = signal<any>(null);
  orderLoading = signal(false);
  orderSuccess = signal(false);
  orderError = signal('');
  orderQty = 1;
  orderAddress = '';
  orderNotes = '';
  searchTerm = '';

  filters: any = { category: '', type: '', minPrice: null, maxPrice: null };

  categories = [
    { value: 'SEED', label: 'Semences' },
    { value: 'FERTILIZER', label: 'Fertilisants' },
    { value: 'PESTICIDE', label: 'Pesticides' },
    { value: 'EQUIPMENT', label: 'Équipements' },
    { value: 'SERVICE', label: 'Services' },
    { value: 'HARVEST', label: 'Récoltes' },
    { value: 'INSURANCE_PRODUCT', label: "Produits d'assurance" },
    { value: 'OTHER', label: 'Autre' }
  ];

  ngOnInit() { this.doSearch(); }

  doSearch() {
    this.loading.set(true);
    this.svc.search({ ...this.filters, search: this.searchTerm || null, page: this.currentPage() }).subscribe({
      next: r => { this.result.set(r); this.listings.set(r.content ?? []); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  goPage(p: number) { this.currentPage.set(p); this.doSearch(); }

  resetFilters() {
    this.filters = { category: '', type: '', minPrice: null, maxPrice: null };
    this.searchTerm = '';
    this.currentPage.set(0);
    this.doSearch();
  }

  openListing(l: any) {
    this.selectedListing.set(l);
    this.orderQty = 1;
    this.orderAddress = '';
    this.orderNotes = '';
    this.orderSuccess.set(false);
    this.orderError.set('');
  }

  closeListing() { this.selectedListing.set(null); }

  placeOrder(l: any) {
    this.orderLoading.set(true);
    this.orderError.set('');
    this.svc.placeOrder({
      listingId: l.id,
      quantity: this.orderQty,
      paymentSource: 'WALLET',
      deliveryAddress: this.orderAddress,
      notes: this.orderNotes
    }).subscribe({
      next: () => { this.orderSuccess.set(true); this.orderLoading.set(false); },
      error: (e) => { this.orderError.set(e?.error?.message || 'Erreur lors de la commande'); this.orderLoading.set(false); }
    });
  }

  typeLabel(t: string) { const m: any = { SALE: 'Vente', RENT: 'Location', SERVICE: 'Service' }; return m[t] ?? t; }
  catLabel(c: string) { return this.categories.find(x => x.value === c)?.label ?? c; }
}

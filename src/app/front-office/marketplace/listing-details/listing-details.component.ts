import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MarketplaceService } from '../marketplace.service';

@Component({
  selector: 'app-listing-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="ld-page">

      <!-- Loading -->
      <div *ngIf="loading()" class="ld-loading">
        <div class="ld-spinner"></div>
        <p>Chargement de l'annonce…</p>
      </div>

      <!-- Error -->
      <div *ngIf="!loading() && errorMsg()" class="ld-error-box">
        <i class="feather icon-alert-circle"></i>
        <p>{{ errorMsg() }}</p>
        <a routerLink="/front-office/marketplace" class="ld-btn ld-btn-outline">Retour au marketplace</a>
      </div>

      <!-- Content -->
      <div *ngIf="!loading() && listing()" class="ld-content">

        <!-- Breadcrumb -->
        <div class="ld-breadcrumb">
          <a routerLink="/front-office/marketplace">Marketplace</a>
          <span class="ld-crumb-sep">›</span>
          <span>{{ listing()?.title }}</span>
        </div>

        <div class="ld-grid">

          <!-- Left: images -->
          <div class="ld-images">
            <div class="ld-main-img">
              <img *ngIf="currentImage()" [src]="currentImage()" [alt]="listing()?.title" class="ld-img">
              <div *ngIf="!currentImage()" class="ld-img-placeholder">
                <i class="feather icon-image"></i>
              </div>
              <span class="ld-type-badge ld-type--{{listing()?.type?.toLowerCase()}}">{{ typeLabel(listing()?.type) }}</span>
            </div>
            <div class="ld-thumbs" *ngIf="listing()?.images?.length > 1">
              <div *ngFor="let img of listing()?.images; let i = index"
                class="ld-thumb" [class.ld-thumb--active]="selectedImg() === i"
                (click)="selectedImg.set(i)">
                <img [src]="img" [alt]="'Image ' + (i+1)">
              </div>
            </div>
          </div>

          <!-- Right: info -->
          <div class="ld-info">
            <span class="ld-cat-badge">{{ catLabel(listing()?.category) }}</span>
            <h1 class="ld-title">{{ listing()?.title }}</h1>

            <div class="ld-price-row">
              <span class="ld-price">{{ listing()?.price | number:'1.0-0' }} DT</span>
              <span class="ld-unit" *ngIf="listing()?.unit">/ {{ listing()?.unit }}</span>
            </div>

            <div class="ld-rating" *ngIf="listing()?.reviewCount > 0">
              <span class="ld-stars">★ {{ listing()?.averageRating | number:'1.1-1' }}</span>
              <span class="ld-review-count">({{ listing()?.reviewCount }} avis)</span>
            </div>

            <p class="ld-description">{{ listing()?.description }}</p>

            <div class="ld-meta-grid">
              <div class="ld-meta-item" *ngIf="listing()?.sellerName">
                <i class="feather icon-user"></i>
                <div>
                  <div class="ld-meta-label">Vendeur</div>
                  <div class="ld-meta-value">{{ listing()?.sellerName }}</div>
                </div>
              </div>
              <div class="ld-meta-item" *ngIf="listing()?.location">
                <i class="feather icon-map-pin"></i>
                <div>
                  <div class="ld-meta-label">Localisation</div>
                  <div class="ld-meta-value">{{ listing()?.location }}</div>
                </div>
              </div>
              <div class="ld-meta-item">
                <i class="feather icon-package"></i>
                <div>
                  <div class="ld-meta-label">Stock disponible</div>
                  <div class="ld-meta-value">{{ listing()?.stock ?? '—' }}</div>
                </div>
              </div>
              <div class="ld-meta-item" *ngIf="listing()?.createdAt">
                <i class="feather icon-calendar"></i>
                <div>
                  <div class="ld-meta-label">Publié le</div>
                  <div class="ld-meta-value">{{ listing()?.createdAt | date:'dd/MM/yyyy' }}</div>
                </div>
              </div>
            </div>

            <!-- Order form -->
            <div class="ld-order-section" *ngIf="!orderSuccess()">
              <h5 class="ld-order-title">Commander</h5>
              <div class="ld-form-row">
                <div class="ld-field">
                  <label>Quantité</label>
                  <input type="number" class="ld-input" [(ngModel)]="orderQty" min="1" [max]="listing()?.stock">
                </div>
                <div class="ld-field">
                  <label>Adresse de livraison</label>
                  <input type="text" class="ld-input" [(ngModel)]="orderAddress" placeholder="Votre adresse">
                </div>
              </div>
              <div class="ld-field">
                <label>Notes</label>
                <input type="text" class="ld-input" [(ngModel)]="orderNotes" placeholder="Instructions particulières...">
              </div>
              <div class="ld-order-total">
                Total : <strong>{{ (listing()?.price ?? 0) * orderQty | number:'1.0-0' }} DT</strong>
              </div>
              <button class="ld-order-btn" (click)="placeOrder()" [disabled]="orderLoading()">
                <i class="feather icon-shopping-cart"></i>
                {{ orderLoading() ? 'Traitement...' : 'Commander maintenant' }}
              </button>
              <p *ngIf="orderError()" class="ld-order-error">{{ orderError() }}</p>
            </div>
            <div class="ld-order-ok" *ngIf="orderSuccess()">
              <i class="feather icon-check-circle"></i>
              <p>Commande passée avec succès !</p>
              <a routerLink="/front-office/marketplace/my-orders" class="ld-btn ld-btn-outline">Voir mes commandes</a>
            </div>
          </div>
        </div>

        <!-- Reviews section -->
        <div class="ld-reviews-section">
          <h5 class="ld-section-title">Avis des acheteurs</h5>
          <div *ngIf="reviews().length === 0" class="ld-no-reviews">
            <i class="feather icon-message-circle"></i>
            <p>Aucun avis pour le moment.</p>
          </div>
          <div class="ld-reviews-list" *ngIf="reviews().length > 0">
            <div class="ld-review-card" *ngFor="let r of reviews()">
              <div class="ld-review-head">
                <div class="ld-reviewer-avatar">{{ initials(r.reviewerName) }}</div>
                <div>
                  <div class="ld-reviewer-name">{{ r.reviewerName }}</div>
                  <div class="ld-review-date">{{ r.createdAt | date:'dd/MM/yyyy' }}</div>
                </div>
                <div class="ld-review-stars">
                  <span *ngFor="let s of [1,2,3,4,5]" class="ld-star" [class.active]="r.rating >= s">★</span>
                </div>
              </div>
              <p class="ld-review-comment" *ngIf="r.comment">{{ r.comment }}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .ld-page { padding: 24px 28px; max-width: 1200px; margin: 0 auto; font-family: 'Inter', sans-serif; }

    /* Loading / Error */
    .ld-loading { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 80px; color: #64748b; }
    .ld-spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #2e8b57; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ld-error-box { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: #e53935; text-align: center; }
    .ld-error-box i { font-size: 2.5rem; }

    /* Breadcrumb */
    .ld-breadcrumb { display: flex; align-items: center; gap: 8px; font-size: .82rem; color: #94a3b8; margin-bottom: 20px; }
    .ld-breadcrumb a { color: #2e8b57; text-decoration: none; font-weight: 500; }
    .ld-breadcrumb a:hover { text-decoration: underline; }
    .ld-crumb-sep { color: #d1d5db; }

    /* Grid */
    .ld-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }

    /* Images */
    .ld-images { display: flex; flex-direction: column; gap: 12px; }
    .ld-main-img { position: relative; border-radius: 16px; overflow: hidden; background: #f8fafc; aspect-ratio: 4/3; }
    .ld-img { width: 100%; height: 100%; object-fit: cover; }
    .ld-img-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; color: #d1d5db; font-size: 3.5rem; }
    .ld-type-badge { position: absolute; top: 14px; left: 14px; padding: 4px 12px; border-radius: 999px; font-size: .72rem; font-weight: 700; }
    .ld-type--sale    { background: #d1fae5; color: #065f46; }
    .ld-type--rent    { background: #dbeafe; color: #1e40af; }
    .ld-type--service { background: #ede9fe; color: #5b21b6; }
    .ld-thumbs { display: flex; gap: 8px; }
    .ld-thumb { width: 64px; height: 64px; border-radius: 10px; overflow: hidden; border: 2px solid transparent; cursor: pointer; transition: border-color .15s; }
    .ld-thumb--active { border-color: #2e8b57; }
    .ld-thumb img { width: 100%; height: 100%; object-fit: cover; }

    /* Info */
    .ld-info { display: flex; flex-direction: column; gap: 6px; }
    .ld-cat-badge { display: inline-block; padding: 3px 10px; background: #f3f4f6; color: #374151; border-radius: 999px; font-size: .72rem; font-weight: 600; width: fit-content; }
    .ld-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 4px 0 8px; }
    .ld-price-row { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
    .ld-price { font-size: 1.6rem; font-weight: 800; color: #2e8b57; }
    .ld-unit { font-size: .85rem; color: #6b7280; }
    .ld-rating { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
    .ld-stars { color: #f59e0b; font-weight: 700; font-size: .9rem; }
    .ld-review-count { font-size: .8rem; color: #94a3b8; }
    .ld-description { font-size: .9rem; color: #374151; line-height: 1.7; margin: 8px 0 16px; }

    /* Meta grid */
    .ld-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .ld-meta-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9; }
    .ld-meta-item i { color: #2e8b57; margin-top: 2px; }
    .ld-meta-label { font-size: .68rem; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
    .ld-meta-value { font-size: .88rem; font-weight: 600; color: #0f172a; }

    /* Order */
    .ld-order-section { border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 8px; }
    .ld-order-title { font-size: .95rem; font-weight: 700; color: #0f172a; margin: 0 0 14px; }
    .ld-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .ld-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
    .ld-field label { font-size: .72rem; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; }
    .ld-input { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: .9rem; font-family: inherit; }
    .ld-input:focus { outline: none; border-color: #2e8b57; box-shadow: 0 0 0 3px rgba(46,139,87,.1); }
    .ld-order-total { font-size: 1rem; color: #1e293b; margin-bottom: 14px; }
    .ld-order-btn { width: 100%; padding: 14px; background: #2e8b57; color: #fff; border: none; border-radius: 10px; font-size: .95rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .ld-order-btn:hover { background: #1b7a47; }
    .ld-order-btn:disabled { opacity: .6; cursor: not-allowed; }
    .ld-order-error { color: #e53935; font-size: .82rem; margin-top: 8px; text-align: center; }
    .ld-order-ok { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 32px 0; color: #2e8b57; text-align: center; border-top: 1px solid #f1f5f9; margin-top: 16px; }
    .ld-order-ok i { font-size: 2.5rem; }

    /* Buttons */
    .ld-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 8px; font-size: .85rem; font-weight: 600; cursor: pointer; text-decoration: none; border: none; transition: all .18s; }
    .ld-btn-outline { background: #fff; color: #2e8b57; border: 1.5px solid #2e8b57; }
    .ld-btn-outline:hover { background: #f0fdf4; }

    /* Reviews */
    .ld-reviews-section { border-top: 1px solid #e5e7eb; padding-top: 28px; }
    .ld-section-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0 0 16px; }
    .ld-no-reviews { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px; color: #94a3b8; }
    .ld-no-reviews i { font-size: 2rem; }
    .ld-reviews-list { display: flex; flex-direction: column; gap: 12px; }
    .ld-review-card { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 16px; }
    .ld-review-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .ld-reviewer-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #2e8b57, #52b788); color: #fff; font-size: .75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; text-transform: uppercase; flex-shrink: 0; }
    .ld-reviewer-name { font-weight: 600; font-size: .88rem; color: #0f172a; }
    .ld-review-date { font-size: .72rem; color: #94a3b8; }
    .ld-review-stars { margin-left: auto; }
    .ld-star { font-size: 1rem; color: #d1d5db; }
    .ld-star.active { color: #f59e0b; }
    .ld-review-comment { font-size: .85rem; color: #374151; line-height: 1.5; margin: 0; }

    @media (max-width: 768px) {
      .ld-grid { grid-template-columns: 1fr; }
      .ld-form-row { grid-template-columns: 1fr; }
      .ld-meta-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ListingDetailsComponent implements OnInit {
  private svc = inject(MarketplaceService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  listing = signal<any>(null);
  reviews = signal<any[]>([]);
  loading = signal(true);
  errorMsg = signal('');
  selectedImg = signal(0);

  orderQty = 1;
  orderAddress = '';
  orderNotes = '';
  orderLoading = signal(false);
  orderSuccess = signal(false);
  orderError = signal('');

  categories = [
    { value: 'SEED', label: 'Semences' }, { value: 'FERTILIZER', label: 'Fertilisants' },
    { value: 'PESTICIDE', label: 'Pesticides' }, { value: 'EQUIPMENT', label: 'Équipements' },
    { value: 'SERVICE', label: 'Services' }, { value: 'HARVEST', label: 'Récoltes' },
    { value: 'INSURANCE_PRODUCT', label: "Produits d'assurance" }, { value: 'OTHER', label: 'Autre' }
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMsg.set('Annonce introuvable.');
      this.loading.set(false);
      return;
    }
    this.svc.getListing(id).subscribe({
      next: (data: any) => {
        this.listing.set(data);
        this.loading.set(false);
        this.loadReviews(id);
      },
      error: () => {
        this.errorMsg.set('Impossible de charger cette annonce.');
        this.loading.set(false);
      }
    });
  }

  private loadReviews(id: number): void {
    this.svc.getReviews(id).subscribe({
      next: (data: any[]) => this.reviews.set(data),
      error: () => {}
    });
  }

  currentImage(): string | null {
    const imgs = this.listing()?.images;
    if (!imgs || imgs.length === 0) return null;
    return imgs[this.selectedImg()] ?? imgs[0];
  }

  placeOrder(): void {
    const l = this.listing();
    if (!l) return;
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
      error: (e: any) => {
        this.orderError.set(e?.error?.message || 'Erreur lors de la commande');
        this.orderLoading.set(false);
      }
    });
  }

  typeLabel(t: string): string {
    const m: any = { SALE: 'Vente', RENT: 'Location', SERVICE: 'Service' };
    return m[t] ?? t;
  }

  catLabel(c: string): string {
    return this.categories.find(x => x.value === c)?.label ?? c;
  }

  initials(name: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
  }
}

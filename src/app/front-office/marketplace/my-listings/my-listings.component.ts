import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MarketplaceService } from '../marketplace.service';

@Component({
  selector: 'app-my-listings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="ml-page">
      <div class="ml-header">
        <div>
          <h4 class="ml-title">Mes annonces</h4>
          <p class="ml-sub">Gérez vos annonces publiées sur la marketplace</p>
        </div>
        <a routerLink="/front-office/marketplace/publish" class="ml-publish-btn">
          <i class="feather icon-plus"></i> Nouvelle annonce
        </a>
      </div>

      <div *ngIf="loading()" class="ml-loading"><div class="ml-spinner"></div></div>

      <div class="ml-table-wrap" *ngIf="!loading()">
        <table class="ml-table" *ngIf="listings().length > 0">
          <thead>
            <tr><th>Annonce</th><th>Catégorie</th><th>Type</th><th>Prix</th><th>Stock</th><th>Statut</th><th>Note</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let l of listings()">
              <td>
                <div class="ml-listing-name">{{ l.title }}</div>
                <div class="ml-listing-date">{{ l.createdAt | date:'dd/MM/yyyy' }}</div>
              </td>
              <td><span class="ml-cat">{{ catLabel(l.category) }}</span></td>
              <td>{{ typeLabel(l.type) }}</td>
              <td class="ml-price">{{ l.price | number:'1.0-0' }} DT<span *ngIf="l.unit"> / {{ l.unit }}</span></td>
              <td>{{ l.stock }}</td>
              <td><span class="ml-status ml-status--{{l.status?.toLowerCase()}}">{{ statusLabel(l.status) }}</span></td>
              <td>
                <span *ngIf="l.reviewCount > 0" class="ml-rating">⭐ {{ l.averageRating | number:'1.1-1' }}</span>
                <span *ngIf="l.reviewCount === 0" class="ml-no-rating">—</span>
              </td>
              <td>
                <a class="ml-edit-btn" *ngIf="l.status === 'ACTIVE' || l.status === 'PENDING'"
                   [routerLink]="'/front-office/marketplace/edit/' + l.id" title="Modifier">
                  <i class="feather icon-edit-2"></i>
                </a>
                <button class="ml-close-btn" *ngIf="l.status === 'ACTIVE' || l.status === 'PENDING'"
                        (click)="close(l.id)" title="Clôturer">
                  <i class="feather icon-x-circle"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="ml-empty" *ngIf="listings().length === 0">
          <i class="feather icon-inbox"></i>
          <p>Vous n'avez pas encore d'annonces.</p>
          <a routerLink="/front-office/marketplace/publish" class="ml-publish-btn">Publier une annonce</a>
        </div>
      </div>

      <div *ngIf="adminNote()" class="ml-admin-note">
        <i class="feather icon-message-square"></i> Note admin : {{ adminNote() }}
      </div>
    </div>
  `,
  styles: [`
    .ml-page { padding: 24px; }
    .ml-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .ml-title { font-size: 1.2rem; font-weight: 800; color: #1e293b; margin: 0 0 4px; }
    .ml-sub { font-size: .85rem; color: #6b7280; margin: 0; }
    .ml-publish-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; background: #2e8b57; color: #fff; border-radius: 8px; font-size: .85rem; font-weight: 700; text-decoration: none; }
    .ml-publish-btn:hover { background: #1b7a47; color: #fff; }
    .ml-loading { display: flex; justify-content: center; padding: 60px; }
    .ml-spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #2e8b57; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ml-table-wrap { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.06); border: 1px solid #f0f0f0; }
    .ml-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
    .ml-table th { padding: 10px 16px; background: #f8fafc; color: #6b7280; font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .ml-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .ml-listing-name { font-weight: 600; color: #1e293b; }
    .ml-listing-date { font-size: .72rem; color: #94a3b8; margin-top: 2px; }
    .ml-cat { background: #f3f4f6; color: #374151; padding: 2px 8px; border-radius: 999px; font-size: .72rem; font-weight: 600; }
    .ml-price { font-weight: 700; color: #2e8b57; }
    .ml-status { padding: 3px 10px; border-radius: 999px; font-size: .7rem; font-weight: 700; }
    .ml-status--pending  { background: #fef3c7; color: #92400e; }
    .ml-status--active   { background: #d1fae5; color: #065f46; }
    .ml-status--sold     { background: #dbeafe; color: #1e40af; }
    .ml-status--rejected { background: #fee2e2; color: #b91c1c; }
    .ml-status--closed   { background: #f3f4f6; color: #6b7280; }
    .ml-rating { color: #f59e0b; font-weight: 600; font-size: .8rem; }
    .ml-no-rating { color: #d1d5db; }
    .ml-close-btn { background: none; border: none; cursor: pointer; color: #e53935; font-size: 1rem; }
    .ml-edit-btn { background: none; border: none; cursor: pointer; color: #2e8b57; font-size: 1rem; text-decoration: none; margin-right: 8px; display: inline-block; }
    .ml-edit-btn:hover { color: #1b7a47; }
    .ml-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: #94a3b8; }
    .ml-empty i { font-size: 2.5rem; }
    .ml-admin-note { margin-top: 16px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; font-size: .85rem; color: #92400e; display: flex; align-items: center; gap: 8px; }
  `]
})
export class MyListingsComponent implements OnInit {
  private svc = inject(MarketplaceService);
  listings = signal<any[]>([]);
  loading = signal(true);
  adminNote = signal('');

  categories = [
    { value: 'SEED', label: 'Semences' }, { value: 'FERTILIZER', label: 'Fertilisants' },
    { value: 'PESTICIDE', label: 'Pesticides' }, { value: 'EQUIPMENT', label: 'Équipements' },
    { value: 'SERVICE', label: 'Services' }, { value: 'HARVEST', label: 'Récoltes' },
    { value: 'INSURANCE_PRODUCT', label: "Produits d'assurance" }, { value: 'OTHER', label: 'Autre' }
  ];

  ngOnInit() {
    this.svc.getMyListings().subscribe({
      next: d => { this.listings.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  close(id: number) {
    if (!confirm('Clôturer cette annonce ?')) return;
    this.svc.closeListing(id).subscribe(() => {
      this.listings.update(ls => ls.map(l => l.id === id ? { ...l, status: 'CLOSED' } : l));
    });
  }

  typeLabel(t: string) { const m: any = { SALE: 'Vente', RENT: 'Location', SERVICE: 'Service' }; return m[t] ?? t; }
  catLabel(c: string) { return this.categories.find(x => x.value === c)?.label ?? c; }
  statusLabel(s: string) { const m: any = { PENDING: 'En attente', ACTIVE: 'Active', SOLD: 'Vendue', REJECTED: 'Rejetée', CLOSED: 'Clôturée' }; return m[s] ?? s; }
}

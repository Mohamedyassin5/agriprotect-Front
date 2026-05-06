import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MarketplaceService } from '../marketplace.service';

@Component({
  selector: 'app-edit-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="el-page">
      <div class="el-card">

        <!-- Loading -->
        <div *ngIf="loading()" class="el-loading">
          <div class="el-spinner"></div>
          <p>Chargement de l'annonce…</p>
        </div>

        <!-- Error -->
        <div *ngIf="!loading() && fetchError()" class="el-error-box">
          <i class="feather icon-alert-circle"></i>
          <p>{{ fetchError() }}</p>
          <a routerLink="/front-office/marketplace/my-listings" class="el-btn el-btn-outline">Retour à mes annonces</a>
        </div>

        <!-- Form -->
        <ng-container *ngIf="!loading() && !fetchError()">
          <div class="el-header">
            <div>
              <h4 class="el-title">Modifier l'annonce</h4>
              <p class="el-sub">Mettez à jour les informations de votre annonce</p>
            </div>
            <a routerLink="/front-office/marketplace/my-listings" class="el-back-btn">
              <i class="feather icon-arrow-left"></i> Retour
            </a>
          </div>

          <form class="el-form" (ngSubmit)="submit()">
            <div class="el-form-grid">
              <div class="el-field el-field--full">
                <label>Titre de l'annonce *</label>
                <input type="text" [(ngModel)]="form.title" name="title" required class="el-input"
                  placeholder="Ex: Semences de blé certifiées – 50kg">
              </div>

              <div class="el-field">
                <label>Catégorie *</label>
                <select [(ngModel)]="form.category" name="category" class="el-input" required>
                  <option value="">Choisir...</option>
                  <option *ngFor="let c of categories" [value]="c.value">{{ c.label }}</option>
                </select>
              </div>

              <div class="el-field">
                <label>Type d'annonce *</label>
                <select [(ngModel)]="form.type" name="type" class="el-input" required>
                  <option value="">Choisir...</option>
                  <option value="SALE">Vente</option>
                  <option value="RENT">Location</option>
                  <option value="SERVICE">Service</option>
                </select>
              </div>

              <div class="el-field">
                <label>Prix (DT) *</label>
                <input type="number" [(ngModel)]="form.price" name="price" min="0" step="0.01" required class="el-input" placeholder="0.00">
              </div>

              <div class="el-field">
                <label>Unité</label>
                <input type="text" [(ngModel)]="form.unit" name="unit" class="el-input" placeholder="kg, heure, unité...">
              </div>

              <div class="el-field">
                <label>Quantité disponible</label>
                <input type="number" [(ngModel)]="form.stock" name="stock" min="1" class="el-input" placeholder="1">
              </div>

              <div class="el-field">
                <label>Localisation</label>
                <input type="text" [(ngModel)]="form.location" name="location" class="el-input" placeholder="Ville, région...">
              </div>

              <div class="el-field el-field--full">
                <label>Description *</label>
                <textarea [(ngModel)]="form.description" name="description" rows="5" required
                  class="el-input el-textarea" placeholder="Décrivez votre produit ou service en détail..."></textarea>
              </div>

              <div class="el-field el-field--full">
                <label>URLs des images (une par ligne)</label>
                <textarea [(ngModel)]="imagesText" name="images" rows="3"
                  class="el-input el-textarea" placeholder="https://exemple.com/image1.jpg"></textarea>
              </div>
            </div>

            <div class="el-notice">
              <i class="feather icon-info"></i>
              Les modifications seront appliquées immédiatement à votre annonce.
            </div>

            <div class="el-actions">
              <button type="button" class="el-cancel-btn" (click)="goBack()">Annuler</button>
              <button type="submit" class="el-submit-btn" [disabled]="saving()">
                <i class="feather icon-save"></i>
                {{ saving() ? 'Enregistrement...' : 'Enregistrer les modifications' }}
              </button>
            </div>

            <div class="el-success" *ngIf="success()">
              <i class="feather icon-check-circle"></i>
              Annonce mise à jour avec succès !
            </div>
            <div class="el-error" *ngIf="saveError()">{{ saveError() }}</div>
          </form>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .el-page { padding: 24px; max-width: 800px; margin: 0 auto; font-family: 'Inter', sans-serif; }
    .el-card { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,.06); border: 1px solid #f0f0f0; }

    /* Loading / Error */
    .el-loading { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 60px; color: #64748b; }
    .el-spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #2e8b57; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .el-error-box { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; color: #e53935; text-align: center; }
    .el-error-box i { font-size: 2rem; }

    /* Header */
    .el-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
    .el-title { font-size: 1.3rem; font-weight: 800; color: #1e293b; margin: 0 0 6px; }
    .el-sub { font-size: .85rem; color: #6b7280; margin: 0; }
    .el-back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .82rem; color: #374151; text-decoration: none; font-weight: 500; }
    .el-back-btn:hover { border-color: #2e8b57; color: #2e8b57; }

    /* Form */
    .el-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 20px; margin-bottom: 20px; }
    .el-field { display: flex; flex-direction: column; gap: 6px; }
    .el-field label { font-size: .72rem; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; font-weight: 700; }
    .el-field--full { grid-column: 1 / -1; }
    .el-input { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: .9rem; font-family: inherit; }
    .el-input:focus { outline: none; border-color: #2e8b57; box-shadow: 0 0 0 3px rgba(46,139,87,.1); }
    .el-textarea { resize: vertical; min-height: 80px; }
    .el-notice { background: #f0faf4; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 16px; font-size: .82rem; color: #065f46; display: flex; align-items: flex-start; gap: 8px; margin-bottom: 24px; }
    .el-actions { display: flex; gap: 12px; justify-content: flex-end; }
    .el-cancel-btn { padding: 12px 24px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; color: #374151; cursor: pointer; font-size: .9rem; }
    .el-submit-btn { padding: 12px 28px; background: #2e8b57; color: #fff; border: none; border-radius: 8px; font-size: .9rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; }
    .el-submit-btn:disabled { opacity: .6; cursor: not-allowed; }
    .el-success { margin-top: 16px; color: #065f46; background: #d1fae5; border-radius: 8px; padding: 12px 16px; text-align: center; display: flex; align-items: center; gap: 8px; justify-content: center; }
    .el-error { margin-top: 12px; color: #b91c1c; text-align: center; font-size: .85rem; }

    /* Buttons */
    .el-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 8px; font-size: .85rem; font-weight: 600; cursor: pointer; text-decoration: none; border: none; transition: all .18s; }
    .el-btn-outline { background: #fff; color: #374151; border: 1.5px solid #e2e8f0; }
    .el-btn-outline:hover { border-color: #2e8b57; color: #2e8b57; }

    @media (max-width: 600px) { .el-form-grid { grid-template-columns: 1fr; } }
  `]
})
export class EditListingComponent implements OnInit {
  private svc = inject(MarketplaceService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(true);
  saving = signal(false);
  success = signal(false);
  fetchError = signal('');
  saveError = signal('');
  imagesText = '';
  listingId = 0;

  form: any = { title: '', description: '', category: '', type: '', price: null, unit: '', stock: 1, location: '' };

  categories = [
    { value: 'SEED', label: 'Semences' }, { value: 'FERTILIZER', label: 'Fertilisants' },
    { value: 'PESTICIDE', label: 'Pesticides' }, { value: 'EQUIPMENT', label: 'Équipements' },
    { value: 'SERVICE', label: 'Services' }, { value: 'HARVEST', label: 'Récoltes' },
    { value: 'INSURANCE_PRODUCT', label: "Produits d'assurance" }, { value: 'OTHER', label: 'Autre' }
  ];

  ngOnInit(): void {
    this.listingId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.listingId) {
      this.fetchError.set('Annonce introuvable.');
      this.loading.set(false);
      return;
    }
    this.svc.getListing(this.listingId).subscribe({
      next: (data: any) => {
        this.form = {
          title: data.title ?? '',
          description: data.description ?? '',
          category: data.category ?? '',
          type: data.type ?? '',
          price: data.price ?? null,
          unit: data.unit ?? '',
          stock: data.stock ?? 1,
          location: data.location ?? ''
        };
        this.imagesText = (data.images ?? []).join('\n');
        this.loading.set(false);
      },
      error: () => {
        this.fetchError.set('Impossible de charger cette annonce.');
        this.loading.set(false);
      }
    });
  }

  submit(): void {
    this.saving.set(true);
    this.saveError.set('');
    this.success.set(false);
    const images = this.imagesText.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    this.svc.updateListing(this.listingId, { ...this.form, images }).subscribe({
      next: () => { this.success.set(true); this.saving.set(false); },
      error: (e: any) => {
        this.saveError.set(e?.error?.message || 'Erreur lors de la mise à jour');
        this.saving.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/front-office/marketplace/my-listings']);
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MarketplaceService } from '../marketplace.service';

@Component({
  selector: 'app-publish-listing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pl-page">
      <div class="pl-card">
        <div class="pl-header">
          <h4 class="pl-title">Publier une annonce</h4>
          <p class="pl-sub">Votre annonce sera examinée par un administrateur avant publication</p>
        </div>

        <form class="pl-form" (ngSubmit)="submit()">
          <div class="pl-form-grid">
            <div class="pl-field pl-field--full">
              <label>Titre de l'annonce *</label>
              <input type="text" [(ngModel)]="form.title" name="title" placeholder="Ex: Semences de blé certifiées – 50kg" required class="pl-input">
            </div>

            <div class="pl-field">
              <label>Catégorie *</label>
              <select [(ngModel)]="form.category" name="category" class="pl-input" required>
                <option value="">Choisir...</option>
                <option *ngFor="let c of categories" [value]="c.value">{{ c.label }}</option>
              </select>
            </div>

            <div class="pl-field">
              <label>Type d'annonce *</label>
              <select [(ngModel)]="form.type" name="type" class="pl-input" required>
                <option value="">Choisir...</option>
                <option value="SALE">Vente</option>
                <option value="RENT">Location</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>

            <div class="pl-field">
              <label>Prix (DT) *</label>
              <input type="number" [(ngModel)]="form.price" name="price" placeholder="0.00" min="0" step="0.01" required class="pl-input">
            </div>

            <div class="pl-field">
              <label>Unité</label>
              <input type="text" [(ngModel)]="form.unit" name="unit" placeholder="kg, heure, unité..." class="pl-input">
            </div>

            <div class="pl-field">
              <label>Quantité disponible</label>
              <input type="number" [(ngModel)]="form.stock" name="stock" placeholder="1" min="1" class="pl-input">
            </div>

            <div class="pl-field">
              <label>Localisation</label>
              <input type="text" [(ngModel)]="form.location" name="location" placeholder="Ville, région..." class="pl-input">
            </div>

            <div class="pl-field pl-field--full">
              <label>Description *</label>
              <textarea [(ngModel)]="form.description" name="description" rows="5" placeholder="Décrivez votre produit ou service en détail..." required class="pl-input pl-textarea"></textarea>
            </div>

            <div class="pl-field pl-field--full">
              <label>URLs des images (une par ligne)</label>
              <textarea [(ngModel)]="imagesText" name="images" rows="3" placeholder="https://exemple.com/image1.jpg&#10;https://exemple.com/image2.jpg" class="pl-input pl-textarea"></textarea>
            </div>
          </div>

          <div class="pl-notice">
            <i class="feather icon-info"></i>
            Votre annonce sera soumise à validation. Elle apparaîtra sur la marketplace une fois approuvée par l'administration.
          </div>

          <div class="pl-actions">
            <button type="button" class="pl-cancel-btn" (click)="goBack()">Annuler</button>
            <button type="submit" class="pl-submit-btn" [disabled]="loading()">
              <i class="feather icon-send"></i>
              {{ loading() ? 'Envoi en cours...' : 'Soumettre pour validation' }}
            </button>
          </div>

          <div class="pl-success" *ngIf="success()">
            <i class="feather icon-check-circle"></i>
            Annonce soumise avec succès ! Elle est en attente de validation.
          </div>
          <div class="pl-error" *ngIf="error()">{{ error() }}</div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .pl-page { padding: 24px; max-width: 800px; margin: 0 auto; }
    .pl-card { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,.06); border: 1px solid #f0f0f0; }
    .pl-header { margin-bottom: 28px; }
    .pl-title { font-size: 1.3rem; font-weight: 800; color: #1e293b; margin: 0 0 6px; }
    .pl-sub { font-size: .85rem; color: #6b7280; margin: 0; }
    .pl-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 20px; margin-bottom: 20px; }
    .pl-field { display: flex; flex-direction: column; gap: 6px; }
    .pl-field label { font-size: .72rem; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; font-weight: 700; }
    .pl-field--full { grid-column: 1 / -1; }
    .pl-input { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: .9rem; font-family: inherit; }
    .pl-input:focus { outline: none; border-color: #2e8b57; box-shadow: 0 0 0 3px rgba(46,139,87,.1); }
    .pl-textarea { resize: vertical; min-height: 80px; }
    .pl-notice { background: #f0faf4; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 16px; font-size: .82rem; color: #065f46; display: flex; align-items: flex-start; gap: 8px; margin-bottom: 24px; }
    .pl-actions { display: flex; gap: 12px; justify-content: flex-end; }
    .pl-cancel-btn { padding: 12px 24px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; color: #374151; cursor: pointer; font-size: .9rem; }
    .pl-submit-btn { padding: 12px 28px; background: #2e8b57; color: #fff; border: none; border-radius: 8px; font-size: .9rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; }
    .pl-submit-btn:disabled { opacity: .6; cursor: not-allowed; }
    .pl-success { margin-top: 16px; color: #065f46; background: #d1fae5; border-radius: 8px; padding: 12px 16px; text-align: center; display: flex; align-items: center; gap: 8px; justify-content: center; }
    .pl-error { margin-top: 12px; color: #b91c1c; text-align: center; font-size: .85rem; }
    @media (max-width: 600px) { .pl-form-grid { grid-template-columns: 1fr; } }
  `]
})
export class PublishListingComponent {
  private svc = inject(MarketplaceService);
  private router = inject(Router);

  loading = signal(false);
  success = signal(false);
  error = signal('');
  imagesText = '';

  form: any = { title: '', description: '', category: '', type: '', price: null, unit: '', stock: 1, location: '' };

  categories = [
    { value: 'SEED', label: 'Semences' }, { value: 'FERTILIZER', label: 'Fertilisants' },
    { value: 'PESTICIDE', label: 'Pesticides' }, { value: 'EQUIPMENT', label: 'Équipements' },
    { value: 'SERVICE', label: 'Services' }, { value: 'HARVEST', label: 'Récoltes' },
    { value: 'INSURANCE_PRODUCT', label: "Produits d'assurance" }, { value: 'OTHER', label: 'Autre' }
  ];

  submit() {
    this.loading.set(true);
    this.error.set('');
    const images = this.imagesText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    this.svc.createListing({ ...this.form, images }).subscribe({
      next: () => { this.success.set(true); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message || 'Erreur lors de la soumission'); this.loading.set(false); }
    });
  }

  goBack() { this.router.navigate(['/front-office/marketplace']); }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, CropReference } from '../admin.service';

@Component({
  selector: 'app-crops-ref',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crops-ref.component.html',
  styleUrl: '../shared-backoffice.css'
})
export class CropsRefComponent implements OnInit {
  private adminService = inject(AdminService);

  crops: CropReference[] = [];
  loading = true;
  saving = false;
  syncing = false;
  error: string | null = null;
  successMsg: string | null = null;

  showModal = false;
  isEdit = false;
  currentCrop: CropReference = this.emptyForm();

  ngOnInit() { this.loadCrops(); }

  emptyForm(): CropReference {
    return {
      cropType: '',
      referenceYear: new Date().getFullYear(),
      referenceYield: 0,
      referencePrice: 0,
      basePremiumRate: 0.012
    };
  }

  loadCrops() {
    this.loading = true;
    this.error = null;
    this.adminService.getCropReferences().subscribe({
      next: (data) => { this.crops = data; this.loading = false; },
      error: () => { this.error = 'Erreur lors du chargement des cultures.'; this.loading = false; }
    });
  }

  openAdd() {
    this.isEdit = false;
    this.currentCrop = this.emptyForm();
    this.showModal = true;
  }

  openEdit(crop: CropReference) {
    this.isEdit = true;
    this.currentCrop = { ...crop };
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  save() {
    this.saving = true;
    const obs = this.isEdit
      ? this.adminService.updateCropReference(this.currentCrop.id!, this.currentCrop)
      : this.adminService.addCropReference(this.currentCrop);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.showSuccess(this.isEdit ? '✅ Culture mise à jour !' : '✅ Culture ajoutée !');
        this.loadCrops();
      },
      error: () => {
        this.saving = false;
        this.error = 'Erreur lors de la sauvegarde. Vérifiez les données.';
      }
    });
  }

  syncAgridata() {
    this.syncing = true;
    this.error = null;
    this.adminService.syncFromAgridata().subscribe({
      next: (msg) => { this.syncing = false; this.showSuccess(msg); this.loadCrops(); },
      error: () => { this.syncing = false; this.error = '❌ Erreur de synchronisation Agridata.'; }
    });
  }

  showSuccess(msg: string) {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = null, 4000);
  }

  get basePremiumRatePct(): number {
    return Math.round(this.currentCrop.basePremiumRate * 1000) / 10;
  }

  set basePremiumRatePct(val: number) {
    this.currentCrop.basePremiumRate = val / 100;
  }
}

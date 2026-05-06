import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CropService, Crop } from '../crops/crop.service';
import { SinistreService } from '../../core/services/sinistre.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-declare-sinistre',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './declare-sinistre.component.html',
  styleUrls: ['./declare-sinistre.component.css']
})
export class DeclareSinistreComponent implements OnInit {
  private cropService = inject(CropService);
  private sinistreService = inject(SinistreService);
  private authService = inject(AuthService);
  private router = inject(Router);

  myCrops: Crop[] = [];
  loadingCrops = true;

  selectedCropId: string = '';
  claimDate: string = new Date().toISOString().split('T')[0];
  claimDescription: string = '';
  selectedFile: File | null = null;
  isSubmittingClaim = false;

  showResultModal = false;
  sinistreResult: any = null;

  // History State
  showHistoryModal = false;
  claimHistory: any[] = [];
  isLoadingHistory = false;

  ngOnInit() {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.loadingCrops = false;
      return;
    }
    
    this.cropService.getUserCrops(userId).subscribe({
      next: (data: Crop[]) => {
        this.myCrops = data;
        this.loadingCrops = false;
      },
      error: () => {
        this.loadingCrops = false;
      }
    });
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  submitSinistre() {
    if (!this.selectedCropId) {
      alert("Veuillez sélectionner une culture.");
      return;
    }
    if (!this.selectedFile) {
      alert("Veuillez fournir une photo.");
      return;
    }

    const formData = new FormData();
    formData.append('cropId', this.selectedCropId);
    formData.append('dateCatastrophe', new Date(this.claimDate).toISOString());
    formData.append('image', this.selectedFile);
    formData.append('description', this.claimDescription);

    this.isSubmittingClaim = true;
    this.sinistreService.declareSinistre(formData).subscribe({
      next: (res) => {
        this.isSubmittingClaim = false;
        this.sinistreResult = res;
        this.showResultModal = true;
      },
      error: (err) => {
        alert("Erreur lors de la déclaration du sinistre.");
        this.isSubmittingClaim = false;
      }
    });
  }

  closeResultModal() {
    this.showResultModal = false;
    this.sinistreResult = null;
    this.router.navigate(['/front-office/crops']);
  }

  openHistoryModal(): void {
    this.showHistoryModal = true;
    this.loadHistory();
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
  }

  loadHistory(): void {
    this.isLoadingHistory = true;
    this.sinistreService.getMySinistres().subscribe({
      next: (res) => {
        this.claimHistory = res;
        this.isLoadingHistory = false;
      },
      error: (err) => {
        console.error('Error fetching history', err);
        this.isLoadingHistory = false;
      }
    });
  }
}

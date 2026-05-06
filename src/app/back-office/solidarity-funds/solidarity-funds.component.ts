import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SolidarityFundService, SolidarityFund } from '../../core/services/solidarity-fund.service';
import { CropService } from '../../front-office/crops/crop.service';

@Component({
  selector: 'app-admin-solidarity-funds',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './solidarity-funds.component.html',
  styleUrls: ['./solidarity-funds.component.css']
})
export class AdminSolidarityFundsComponent implements OnInit {
  private fundService = inject(SolidarityFundService);
  private cropService = inject(CropService);
  private fb = inject(FormBuilder);

  funds: SolidarityFund[] = [];
  availableCultures: string[] = [];
  loading = true;
  
  showForm = false;
  fundForm: FormGroup;
  submitting = false;
  backendError: string | null = null;
  successMessage: string | null = null;

  constructor() {
    this.fundForm = this.fb.group({
      name: ['', Validators.required],
      numeroFond: ['', Validators.required],
      cultureType: ['', Validators.required],
      minScore: [40, [Validators.required, Validators.min(0), Validators.max(100)]],
      primeAmount: [100, [Validators.required, Validators.min(1)]],
      currentBalance: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.loadFunds();
    this.loadAvailableCultures();
  }

  loadAvailableCultures() {
    this.cropService.getAllCrops().subscribe({
      next: (crops) => {
        const types = crops
          .map(c => c.cropType?.toUpperCase())
          .filter((t, i, arr) => t && arr.indexOf(t) === i);
        this.availableCultures = types;
      },
      error: (err) => console.error('Error loading crop types', err)
    });
  }

  loadFunds() {
    this.loading = true;
    this.fundService.getAllFunds().subscribe({
      next: (data) => {
        this.funds = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading funds', err);
        this.loading = false;
      }
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.backendError = null;
    this.successMessage = null;
    if (this.showForm) {
      this.fundForm.reset({ minScore: 40, primeAmount: 100, currentBalance: 0 });
    }
  }

  submitFund() {
    if (this.fundForm.invalid) {
      this.fundForm.markAllAsTouched();
      this.backendError = "Veuillez corriger les erreurs dans le formulaire.";
      return;
    }

    this.submitting = true;
    this.backendError = null;
    this.successMessage = null;
    
    this.fundService.createFund(this.fundForm.value).subscribe({
      next: (res) => {
        this.successMessage = 'Fonds créé avec succès !';
        setTimeout(() => {
          this.showForm = false;
          this.successMessage = null;
          this.loadFunds();
        }, 2000);
        this.submitting = false;
      },
      error: (err) => {
        console.error('Full Error Object:', err);
        const errorMsg = err.error?.message || err.error || 'Une erreur est survenue lors de la création.';
        this.backendError = errorMsg;
        this.submitting = false;
      }
    });
  }

  deleteFund(id: string) {
    if (confirm('Voulez-vous vraiment supprimer ce fonds ?')) {
      this.fundService.deleteFund(id).subscribe({
        next: () => this.loadFunds(),
        error: (err) => alert('Erreur lors de la suppression')
      });
    }
  }
}

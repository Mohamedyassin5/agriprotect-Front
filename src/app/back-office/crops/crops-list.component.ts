import { Component, OnInit, inject, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CropService, Crop } from '../../front-office/crops/crop.service';
import { UserService } from '../../front-office/profile/user.service';

@Component({
  selector: 'app-crops-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crops-list.component.html',
  styleUrl: './crops-list.component.css',
  encapsulation: ViewEncapsulation.None
})
export class CropsListComponent implements OnInit {
  private cropService = inject(CropService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  crops = signal<Crop[]>([]);
  farmers = signal<any[]>([]);
  searchTerm = signal('');
  isLoading = signal(true);
  
  showForm = signal(false);
  isSubmitting = signal(false);
  selectedCrop = signal<Crop | null>(null);

  cropForm: FormGroup;

  constructor() {
    this.cropForm = this.fb.group({
      userId: ['', Validators.required],
      cropType: ['', Validators.required],
      typeterres: ['', Validators.required],
      surface: [null, [Validators.required, Validators.min(0.1)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      minTemperature: [null, Validators.required],
      maxTemperature: [null, Validators.required],
      averageTemperature: [null, Validators.required],
      minHumidity: [null, Validators.required],
      maxHumidity: [null, Validators.required],
      optimalHumidity: [null, Validators.required]
    });
  }

  uniqueCropTypes = computed(() => {
    const map = new Map<string, Crop>();
    this.crops().forEach(c => {
      if (c.cropType && !map.has(c.cropType.toUpperCase())) {
        map.set(c.cropType.toUpperCase(), c);
      }
    });
    return Array.from(map.values());
  });

  filteredCrops = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.crops();
    
    return this.crops().filter(c => 
      (c.cropType?.toLowerCase() || '').includes(term) ||
      (c.typeterres?.toLowerCase() || '').includes(term)
    );
  });

  onCropTypeSelect(event: any) {
    const type = event.target.value;
    const profile = this.uniqueCropTypes().find(c => c.cropType === type);
    if (profile) {
      this.cropForm.patchValue({
        minTemperature: profile.minTemperature,
        maxTemperature: profile.maxTemperature,
        averageTemperature: profile.averageTemperature,
        minHumidity: profile.minHumidity,
        maxHumidity: profile.maxHumidity,
        optimalHumidity: profile.optimalHumidity,
        typeterres: profile.typeterres
      });
    }
  }

  ngOnInit() {
    this.fetchCrops();
    this.fetchFarmers();
  }

  fetchFarmers() {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        const userArray = Array.isArray(data) ? data : (data as any).content || [];
        this.farmers.set(userArray.filter((u: any) => u.role === 'FARMER'));
      }
    });
  }

  fetchCrops() {
    this.isLoading.set(true);
    
    this.cropService.getAllCrops().subscribe({
      next: (data) => {
        this.crops.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('API ERROR in CropsListComponent:', err);
        this.isLoading.set(false);
      }
    });
  }

  submitCrop() {
    if (this.cropForm.invalid) {
      alert("Veuillez remplir correctement tous les champs requis.");
      return;
    }
    
    this.isSubmitting.set(true);
    const data = { ...this.cropForm.value };
    const userId = data.userId;
    delete data.userId;
    
    this.cropService.addCrop(userId, data).subscribe({
      next: () => {
        alert("Culture créée avec succès.");
        this.fetchCrops();
        this.showForm.set(false);
        this.cropForm.reset();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        alert("Erreur lors de la création de la culture.");
        this.isSubmitting.set(false);
      }
    });
  }

  deleteCrop(id: string | undefined) {
    if (!id) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer cette culture ?')) {
      this.cropService.deleteCrop(id).subscribe({
        next: () => {
          alert('Culture supprimée avec succès.');
          this.fetchCrops();
        },
        error: (err) => {
          alert('Erreur lors de la suppression.');
        }
      });
    }
  }

  viewCropDetails(crop: Crop) {
    this.selectedCrop.set(crop);
  }

  closeCropDetails() {
    this.selectedCrop.set(null);
  }

  onSearch(event: any) {
    this.searchTerm.set(event.target.value);
  }

  getStatus(crop: Crop) {
    const now = new Date();
    const end = new Date(crop.endDate);
    if (end < now) return 'Harvested';
    return 'Active';
  }

  getCropIcon(type: string) {
    const t = type?.toLowerCase() || '';
    if (t.includes('wheat') || t.includes('blé')) return '🌾';
    if (t.includes('corn') || t.includes('maïs')) return '🌽';
    if (t.includes('tomato') || t.includes('tomate')) return '🍅';
    if (t.includes('olive')) return '🫒';
    return '🌱';
  }
}

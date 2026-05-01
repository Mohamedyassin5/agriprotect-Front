import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CropService, Crop } from './crop.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-crops',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './crops.component.html',
  styleUrl: './crops.component.css'
})
export class CropsComponent implements OnInit {
  private cropService = inject(CropService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  crops: Crop[] = [];
  showAddForm = false;
  cropForm: FormGroup;
  isLoading = false;
  userId: string | null = null;

  constructor() {
    this.cropForm = this.fb.group({
      cropType: ['', Validators.required],
      surface: [null, [Validators.required, Validators.min(0.01)]],
      optimalHumidity: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      minHumidity: [30, [Validators.required, Validators.min(0), Validators.max(100)]],
      maxHumidity: [80, [Validators.required, Validators.min(0), Validators.max(100)]],
      minTemperature: [10, Validators.required],
      maxTemperature: [35, Validators.required],
      averageTemperature: [22, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      typeterres: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    console.log('CropsComponent: Initialized with userId:', this.userId);
    
    if (this.userId) {
      this.loadCrops();
    } else {
      console.error('CropsComponent: No userId found in token. User must logout and login again.');
    }
  }

  loadCrops(): void {
    if (!this.userId) return;
    this.isLoading = true;
    this.cropService.getUserCrops(this.userId).subscribe({
      next: (data) => {
        this.crops = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading crops', err);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.cropForm.valid && this.userId) {
      this.isLoading = true;
      console.log('CropsComponent: Submitting crop data:', this.cropForm.value);
      this.cropService.addCrop(this.userId, this.cropForm.value).subscribe({
        next: (newCrop) => {
          console.log('CropsComponent: Crop saved successfully:', newCrop);
          this.crops.unshift(newCrop);
          this.showAddForm = false;
          this.cropForm.reset({
            optimalHumidity: 50,
            minHumidity: 30,
            maxHumidity: 80,
            minTemperature: 10,
            maxTemperature: 35,
            averageTemperature: 22
          });
          this.isLoading = false;
        },
        error: (err) => {
          console.error('CropsComponent: Error adding crop', err);
          this.isLoading = false;
          alert('Failed to save crop. Please check the console for details.');
        }
      });
    } else if (!this.userId) {
      alert('Authentication error: User identity missing. Please log out and log back in.');
    }
  }

  deleteCrop(id: string): void {
    if (confirm('Are you sure you want to delete this crop?')) {
      this.cropService.deleteCrop(id).subscribe({
        next: () => {
          this.crops = this.crops.filter(c => c.id !== id);
        },
        error: (err) => console.error('Error deleting crop', err)
      });
    }
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
  }
}

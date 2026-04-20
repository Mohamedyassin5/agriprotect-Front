import { Component, OnInit, inject, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CropService, Crop } from '../../front-office/crops/crop.service';

@Component({
  selector: 'app-crops-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './crops-list.component.html',
  styleUrl: './crops-list.component.css',
  encapsulation: ViewEncapsulation.None
})
export class CropsListComponent implements OnInit {
  private cropService = inject(CropService);

  crops = signal<Crop[]>([]);
  searchTerm = signal('');
  isLoading = signal(true);

  filteredCrops = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.crops();
    
    return this.crops().filter(c => 
      (c.cropType?.toLowerCase() || '').includes(term) ||
      (c.typeterres?.toLowerCase() || '').includes(term)
    );
  });

  ngOnInit() {
    this.fetchCrops();
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

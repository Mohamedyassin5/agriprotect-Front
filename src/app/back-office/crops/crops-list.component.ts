import { Component, OnInit, inject, signal, computed, ViewEncapsulation, afterNextRender, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CropService, Crop } from '../../front-office/crops/crop.service';
import * as L from 'leaflet';

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
  selectedCrop = signal<Crop | null>(null);
  private map: L.Map | null = null;

  filteredCrops = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.crops();
    
    return this.crops().filter(c => 
      (c.cropType?.toLowerCase() || '').includes(term) ||
      (c.typeterres?.toLowerCase() || '').includes(term) ||
      (c.user?.firstName?.toLowerCase() || '').includes(term) ||
      (c.user?.lastName?.toLowerCase() || '').includes(term)
    );
  });

  activeCropsCount = computed(() => 
    this.crops().filter(c => this.getStatus(c) === 'Active').length
  );

  harvestedCropsCount = computed(() => 
    this.crops().filter(c => this.getStatus(c) === 'Harvested').length
  );

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
    if (t.includes('banane')) return '🍌';
    return '🌱';
  }

  openDetail(crop: Crop) {
    this.selectedCrop.set(crop);
    // Give time for the drawer to animate and container to be available
    setTimeout(() => {
      this.initMap(crop);
    }, 400);
  }

  closeDetail() {
    this.selectedCrop.set(null);
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap(crop: Crop) {
    if (this.map) {
      this.map.remove();
    }

    const mapContainer = document.getElementById('cropMap');
    if (!mapContainer) return;

    // Default coordinates (Tunisia center) if no address/coordinates found
    let lat = 36.8065;
    let lng = 10.1815;

    // Basic map initialization
    this.map = L.map('cropMap').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // If we had coordinates in the address or a geocoding service, we would use them.
    // For now, let's just put a marker and mock a location if the user has an address.
    if (crop.user?.address) {
      // Mock geocoding: use address length to vary position slightly for demo
      const offset = (crop.user.address.length % 10) / 100;
      lat += offset;
      lng += offset;
      this.map.setView([lat, lng], 14);
    }

    L.marker([lat, lng]).addTo(this.map)
      .bindPopup(`<b>${crop.cropType}</b><br>${crop.user?.address || 'Location'}`)
      .openPopup();
  }

  confirmDelete(crop: Crop) {
    if (confirm(`Are you sure you want to delete this ${crop.cropType} crop?`)) {
      this.cropService.deleteCrop(crop.id!).subscribe({
        next: () => {
          this.crops.set(this.crops().filter(c => c.id !== crop.id));
        },
        error: (err) => console.error('Delete failed:', err)
      });
    }
  }
}

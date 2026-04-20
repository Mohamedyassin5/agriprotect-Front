import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CropService } from '../../../front-office/crops/crop.service';

@Component({
  selector: 'app-crop-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './crop-stats.component.html',
  styleUrls: ['./crop-stats.component.css']
})
export class CropStatsComponent implements OnInit {
  private cropService = inject(CropService);

  totalCrops = signal<number>(0);
  totalSurface = signal<number>(0);
  uniqueVarieties = signal<number>(0);

  ngOnInit(): void {
    this.cropService.getAllCrops().subscribe({
      next: (crops) => {
        this.totalCrops.set(crops.length);
        
        const surface = crops.reduce((acc, crop) => acc + (crop.surface || 0), 0);
        this.totalSurface.set(Math.round(surface * 100) / 100);
        
        const varieties = new Set(crops.map(c => c.cropType.toLowerCase())).size;
        this.uniqueVarieties.set(varieties);
      },
      error: (err) => console.error('Error fetching crop stats:', err)
    });
  }
}

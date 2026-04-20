import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CropAiService, CropAiRequest, CropAiResponse } from '../../crops/crop-ai.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-crop-recommendation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crop-recommendation.component.html',
  styleUrl: './crop-recommendation.component.css'
})
export class CropRecommendationComponent {
  private cropAiService = inject(CropAiService);

  formData: CropAiRequest = {
    N: 90,
    P: 42,
    K: 43,
    temperature: 20.8,
    humidity: 82.0,
    ph: 6.5,
    rainfall: 202.9,
    Soil_Fertility_Index: 0.82,
    model: 'xgb',
    top_k: 3
  };

  loading = false;
  showGuide = false;
  results: CropAiResponse | null = null;
  error: string | null = null;

  recommend() {
    this.loading = true;
    this.error = null;
    this.results = null;

    this.cropAiService.getRecommendation(this.formData)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => {
          this.results = res;
        },
        error: (err) => {
          console.error('Recommendation failed', err);
          this.error = 'Impossible de générer des recommandations. Veuillez vérifier les valeurs saisies.';
        }
      });
  }

  getIconForCrop(crop: string): string {
    const icons: { [key: string]: string } = {
      'rice': '🌾',
      'maize': '🌽',
      'chickpea': '🫘',
      'kidneybeans': '🫘',
      'pigeonpeas': '🫛',
      'mothbeans': '🫘',
      'mungbean': '🫛',
      'blackgram': '🫘',
      'lentil': '🍲',
      'pomegranate': '🍎',
      'banana': '🍌',
      'mango': '🥭',
      'grapes': '🍇',
      'watermelon': '🍉',
      'muskmelon': '🍈',
      'apple': '🍎',
      'orange': '🍊',
      'papaya': '🥭',
      'coconut': '🥥',
      'cotton': '🧵',
      'jute': '🧶',
      'coffee': '☕'
    };
    return icons[crop.toLowerCase()] || '🌱';
  }
}

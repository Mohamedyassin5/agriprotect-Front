import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-risk-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './risk-analyzer.component.html',
  styleUrls: ['./risk-analyzer.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class RiskAnalyzerComponent implements OnInit {
  formData: any = {
    Region: 'North',
    Land_Size: '150',
    Revenue: 50000,
    Expenses: 30000,
    Net_Profit: 20000,
    Debt_to_Equity: 0.5,
    Avg_Temperature: 25.0,
    Rainfall: 100.0,
    Drought_Index: 0.2,
    Flood_Risk_Score: 0.1,
    model: 'rf'
  };

  defaultData: any = {
    Loan_Amount: 10000,
    Commodity_Price_Index: 1.0,
    Input_Cost_Index: 1.0,
    Policy_Support_Score: 5,
    Quarter: 'Q1',
    Crop_ID: 'Wheat'
  };

  regions = ['North', 'South', 'East', 'West', 'Central', 'Coastal'];
  
  isScanning: boolean = false;
  scanResult: any = null;
  errorMessage: string = '';

  // Model-specific metrics (Mocked for UI display)
  modelMetrics: any = {
    svm: { accuracy: 0.94, f1: 0.92, speed: 'Fast' },
    rf: { accuracy: 0.96, f1: 0.95, speed: 'Moderate' },
    dt: { accuracy: 0.89, f1: 0.87, speed: 'Instant' },
    knn: { accuracy: 0.91, f1: 0.89, speed: 'Fast' }
  };

  models = [
    { id: 'svm', name: 'Support Vector Machine', best: false },
    { id: 'rf', name: 'Random Forest', best: true },
    { id: 'dt', name: 'Decision Tree', best: false },
    { id: 'knn', name: 'K-Nearest Neighbors', best: false }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  onScan() {
    this.isScanning = true;
    this.scanResult = null;
    this.errorMessage = '';

    const fullPayload = {
      ...this.defaultData,
      ...this.formData,
      Enterprise_Size: this.formData.Land_Size
    };
    
    delete fullPayload.Land_Size;

    // Pointing directly to the Python Risk Service on port 8003
    this.http.post('http://localhost:8003/predict', fullPayload)

      .subscribe({
        next: (res: any) => {
          this.scanResult = {
            ...res,
            metrics: this.modelMetrics[this.formData.model]
          };
          this.isScanning = false;
        },
        error: (err) => {
          console.error('Prediction Error:', err);
          this.errorMessage = 'Erreur lors de la connexion au service IA. Veuillez vérifier que le backend est en cours d\'exécution.';
          this.isScanning = false;
        }
      });
  }

  getRiskClass(prediction: string) {
    if (!prediction) return '';
    const p = prediction.toLowerCase();
    if (p.includes('low') || p.includes('faible')) return 'risk-low';
    if (p.includes('medium') || p.includes('moyen')) return 'risk-medium';
    if (p.includes('high') || p.includes('élevé')) return 'risk-high';
    return 'risk-medium';
  }

  getRiskScore(prediction: string): number {
    const p = prediction.toLowerCase();
    if (p.includes('low') || p.includes('faible')) return 25;
    if (p.includes('medium') || p.includes('moyen')) return 60;
    if (p.includes('high') || p.includes('élevé')) return 90;
    return 50;
  }
}

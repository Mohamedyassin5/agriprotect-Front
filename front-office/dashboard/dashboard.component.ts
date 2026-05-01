import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserSummaryComponent } from './user-summary/user-summary.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, UserSummaryComponent],
  template: `
    <div class="dashboard-container">
      <app-user-summary></app-user-summary>
      
      <div class="dashboard-content">
        <div class="header-section animate-in">
           <h1 class="welcome-title">Bienvenue sur votre Tableau de Bord</h1>
           <p class="welcome-text">Retrouvez ici un aperçu global de votre exploitation et de vos activités AgriProtect.</p>
        </div>
        
        <!-- Dashboard grid for other overview widgets can go here -->
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 10px 0;
      max-width: 1200px;
      margin: 0 auto;
    }
    .welcome-title {
      font-family: 'Outfit', sans-serif;
      color: #1b4332;
      font-size: 28px;
      font-weight: 800;
      margin-top: 30px;
    }
    .welcome-text {
      color: #40916c;
      font-size: 15px;
      margin-bottom: 20px;
    }
    .animate-in {
      animation: fadeIn 0.8s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DashboardComponent {}

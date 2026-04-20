import { Component } from '@angular/core';
import { UserStatsComponent } from './user-stats/user-stats.component';
import { CropStatsComponent } from './crop-stats/crop-stats.component';
import { DashboardChartsComponent } from './dashboard-charts/dashboard-charts.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [UserStatsComponent, CropStatsComponent, DashboardChartsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

}

import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexTooltip, ApexStroke, ApexYAxis, ApexTitleSubtitle, ApexFill, ApexResponsive, ApexPlotOptions, ApexLegend, ApexNonAxisChartSeries } from 'ng-apexcharts';
import { UserService } from '../../../front-office/profile/user.service';
import { CropService } from '../../../front-office/crops/crop.service';
import { forkJoin } from 'rxjs';

export type ChartOptions = {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  fill: ApexFill;
  labels: string[];
  legend: ApexLegend;
  responsive: ApexResponsive[];
  plotOptions: ApexPlotOptions;
  title: ApexTitleSubtitle;
  colors: string[];
};

@Component({
  selector: 'app-dashboard-charts',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './dashboard-charts.component.html',
  styleUrls: ['./dashboard-charts.component.css']
})
export class DashboardChartsComponent implements OnInit {
  private userService = inject(UserService);
  private cropService = inject(CropService);

  public cropChartOptions: Partial<ChartOptions> | any;
  public userGrowthOptions: Partial<ChartOptions> | any;

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    forkJoin({
      users: this.userService.getAllUsers(),
      crops: this.cropService.getAllCrops()
    }).subscribe(({ users, crops }) => {
      this.initCropChart(crops);
      this.initUserGrowthChart(users);
    });
  }

  private initCropChart(crops: any[]): void {
    const cropCounts: Record<string, number> = {};
    crops.forEach(c => {
      const type = c.cropType || 'Unknown';
      cropCounts[type] = (cropCounts[type] || 0) + 1;
    });

    const labels = Object.keys(cropCounts);
    const series = Object.values(cropCounts);

    this.cropChartOptions = {
      series: series,
      chart: {
        type: "donut",
        height: 350,
        animations: { enabled: true, easing: 'easeinout', speed: 800 }
      },
      labels: labels,
      colors: ['#2e8b57', '#a3be8c', '#d4a373', '#b48ead', '#5e81ac', '#bf616a'],
      legend: { position: "bottom", labels: { colors: '#64748b' } },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: { show: true, label: 'Crops', color: '#64748b' }
            }
          }
        }
      },
      dataLabels: { enabled: false },
      responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: "bottom" } } }]
    };
  }

  private initUserGrowthChart(users: any[]): void {
    // Group users by month
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const registrationsPerMonth = new Array(12).fill(0);

    users.forEach(u => {
      if (u.createdAt) {
        const date = new Date(u.createdAt);
        if (date.getFullYear() === currentYear) {
          registrationsPerMonth[date.getMonth()]++;
        }
      }
    });

    // Create cumulative data for area chart
    const seriesData = [];
    let cumulative = 0;
    for (let count of registrationsPerMonth) {
      cumulative += count;
      seriesData.push(cumulative);
    }

    this.userGrowthOptions = {
      series: [{ name: "Total Users", data: seriesData }],
      chart: {
        type: "area",
        height: 350,
        toolbar: { show: false },
        zoom: { enabled: false }
      },
      colors: ['#5e81ac'],
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3 },
      xaxis: {
        categories: months,
        labels: { style: { colors: '#64748b' } }
      },
      yaxis: {
        labels: { style: { colors: '#64748b' } }
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [20, 100, 100, 100]
        }
      },
      tooltip: { x: { format: "dd/MM/yy HH:mm" } }
    };
  }
}

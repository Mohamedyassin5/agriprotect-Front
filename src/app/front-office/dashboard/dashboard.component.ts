import { Component, OnInit, signal } from '@angular/core';
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
           <h1 class="welcome-title">Tableau de Bord <span class="accent">AgriProtect</span></h1>
           <p class="welcome-text">Suivi intelligent en temps réel.</p>
        </div>

        <div class="dashboard-grid">
          <!-- Widget Météo Mini -->
          <div class="premium-card weather-theme animate-in" *ngIf="weather()">
            <div class="card-glow"></div>
            <div class="p-card-header">
              <div class="p-badge">LIVE</div>
              <div class="p-location">Tunis</div>
            </div>

            <div class="p-card-body">
              <div class="temp-main">
                <span class="p-temp">{{ weather()?.temp }}°</span>
                <div class="p-condition">
                  <span class="p-desc">{{ weatherDesc() }}</span>
                  <span class="p-sub">{{ currentDate | date:'EEE d MMM' }}</span>
                </div>
              </div>
              <img [src]="weatherIcon()" class="p-mini-icon" alt="Weather">
            </div>

            <div class="p-card-footer mini-stats">
              <div class="p-stat"><span>{{ weather()?.humidity }}%</span><small>HUM</small></div>
              <div class="p-stat"><span>{{ weather()?.wind }}km/h</span><small>VENT</small></div>
            </div>
          </div>

          <!-- Widget Santé Mini -->
          <div class="premium-card health-theme animate-in" style="animation-delay: 0.1s">
            <div class="card-glow"></div>
            <div class="p-card-header">
              <div class="p-badge success">HEALTH</div>
              <div class="p-location">Status Global</div>
            </div>

            <div class="p-card-body mini-health">
              <div class="p-chart-box-mini">
                <svg viewBox="0 0 36 36" class="p-circular-chart">
                  <path class="p-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="p-circle" stroke-dasharray="92, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span class="p-percent-mini">92%</span>
              </div>
              <div class="p-info-mini">
                <span class="p-headline">Optimale</span>
                <p class="p-subtext-mini">Vos cultures sont en pleine santé.</p>
              </div>
            </div>

            <div class="p-card-footer mini-advice">
               <span><strong>Conseil:</strong> {{ agriAdvice() }}</span>
            </div>
          </div>
        </div>

        <!-- Calendrier de Risques Compact -->
        <div class="risk-timeline-card premium-card animate-in" style="animation-delay: 0.2s">
          <div class="p-card-header">
            <div class="p-badge warning">FORECAST</div>
            <div class="p-location">Prévisions 3 mois</div>
          </div>
          
          <div class="timeline-container-mini">
            <div class="month-item" *ngFor="let month of seasonalRisks">
              <div class="m-name">{{ month.name }}</div>
              <div class="m-temp">{{ month.avgTemp }}°C</div>
              <div class="m-risk" [class]="month.level">
                 <span class="m-icon">{{ month.icon }}</span>
                 <span class="m-label">{{ month.riskName }}</span>
              </div>
            </div>
          </div>
          
          <div class="t-line-mini">
             <div class="t-progress" style="width: 33%"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 10px 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .welcome-title {
      font-family: 'Outfit', sans-serif;
      color: #1b4332;
      font-size: 24px;
      font-weight: 800;
    }
    .welcome-title .accent { color: #52b788; }
    .welcome-text {
      color: #95d5b2;
      font-size: 13px;
      margin-bottom: 25px;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .premium-card {
      position: relative;
      background: white;
      border-radius: 24px;
      padding: 20px;
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.04);
      box-shadow: 0 10px 30px rgba(27, 67, 50, 0.05);
      min-height: 200px;
      display: flex;
      flex-direction: column;
    }

    .card-glow {
      position: absolute;
      top: -50%; left: -50%;
      width: 200%; height: 200%;
      background: radial-gradient(circle at center, rgba(82, 183, 136, 0.05) 0%, transparent 60%);
      pointer-events: none;
    }

    .weather-theme { background: linear-gradient(145deg, #1b4332, #081c15); color: white; border: none; }

    .p-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .p-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 50px;
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
    }
    .p-badge.success { background: rgba(82, 183, 136, 0.15); color: #52b788; }
    .p-badge.warning { background: rgba(255, 153, 0, 0.15); color: #ff9900; }

    .p-location { font-size: 11px; opacity: 0.7; font-weight: 500; }

    .p-card-body {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-grow: 1;
    }

    .p-temp { font-size: 48px; font-weight: 700; font-family: 'Outfit'; letter-spacing: -2px; }
    .p-desc { font-size: 15px; font-weight: 600; display: block; }
    .p-sub { font-size: 11px; opacity: 0.6; }

    .p-mini-icon { width: 50px; height: 50px; }

    .p-card-footer {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid rgba(0,0,0,0.05);
    }
    .weather-theme .p-card-footer { border-top-color: rgba(255,255,255,0.1); }

    .mini-stats { display: flex; gap: 20px; }
    .p-stat span { font-weight: 700; font-size: 14px; margin-right: 5px; }
    .p-stat small { font-size: 9px; opacity: 0.5; }

    /* Health Mini */
    .mini-health { gap: 15px; justify-content: flex-start; }
    .p-chart-box-mini { position: relative; width: 60px; height: 60px; }
    .p-circular-chart { width: 60px; height: 60px; }
    .p-circle-bg { fill: none; stroke: #f3f3f3; stroke-width: 3; }
    .p-circle { fill: none; stroke-width: 3; stroke-linecap: round; stroke: #52b788; }
    .p-percent-mini { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 14px; font-weight: 800; color: #1b4332; }

    .p-headline { font-size: 16px; font-weight: 700; color: #1b4332; }
    .p-subtext-mini { font-size: 11px; color: #74c69d; }

    .mini-advice { font-size: 11px; color: #1b4332; }

    /* Timeline Mini */
    .risk-timeline-card { min-height: auto; width: 100%; }
    .timeline-container-mini {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 10px 0 20px;
    }
    .month-item { text-align: center; }
    .m-name { font-weight: 800; font-size: 11px; color: #1b4332; text-transform: uppercase; margin-bottom: 5px; }
    .m-temp { font-size: 16px; font-weight: 700; color: #2d6a4f; margin-bottom: 8px; }
    .m-risk {
      padding: 8px; border-radius: 12px; font-size: 10px; font-weight: 700;
      display: flex; flex-direction: column; align-items: center; gap: 2px;
    }
    .m-risk.low { background: #ebfbee; color: #2f9e44; }
    .m-risk.mod { background: #fff9db; color: #f08c00; }
    .m-risk.high { background: #fff5f5; color: #e03131; }

    .t-line-mini { height: 4px; background: #f0f0f0; border-radius: 2px; }
    .t-progress { height: 100%; background: #52b788; border-radius: 2px; }

    .animate-in { animation: fadeInUp 0.6s ease-out forwards; }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  weather = signal<any>(null);
  currentDate = new Date();

  seasonalRisks = [
    { name: 'Mai', avgTemp: 22, riskName: 'Idéal', level: 'low', icon: '🌱', action: 'Semis' },
    { name: 'Juin', avgTemp: 27, riskName: 'Canicule', level: 'mod', icon: '☀️', action: 'Irrig.' },
    { name: 'Juillet', avgTemp: 32, riskName: 'Sécher.', level: 'high', icon: '🔥', action: 'Vigil.' }
  ];

  ngOnInit() { this.fetchWeather(); }

  fetchWeather() {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=36.81897&longitude=10.16579&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m')
      .then(res => res.json())
      .then(data => {
        this.weather.set({
          temp: Math.round(data.current.temperature_2m),
          humidity: data.current.relative_humidity_2m,
          wind: Math.round(data.current.wind_speed_10m),
          code: data.current.weather_code
        });
      })
      .catch(() => this.weather.set({ temp: 24, humidity: 45, wind: 12, code: 0 }));
  }

  weatherDesc() {
    const code = this.weather()?.code;
    if (code === 0) return 'Dégagé';
    if (code <= 3) return 'Nuageux';
    if (code >= 51) return 'Pluie';
    return 'Beau Temps';
  }

  weatherIcon() {
    const code = this.weather()?.code;
    if (code === 0) return 'https://cdn-icons-png.flaticon.com/512/869/869869.png';
    if (code <= 3) return 'https://cdn-icons-png.flaticon.com/512/1163/1163661.png';
    return 'https://cdn-icons-png.flaticon.com/512/1163/1163624.png';
  }

  agriAdvice() {
    const code = this.weather()?.code;
    if (code >= 51) return 'Protégez vos plants.';
    if (this.weather()?.temp > 30) return 'Arrosez tôt.';
    return 'Conditions stables.';
  }
}

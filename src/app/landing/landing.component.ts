import {
  Component, OnInit, OnDestroy, HostListener, AfterViewInit, NgZone
} from '@angular/core';
import { RouterLink } from '@angular/router';
import Lenis from 'lenis';
import { HeroComponent } from '../sections/hero/hero.component';
import { RiskStormComponent } from '../sections/risk-storm/risk-storm.component';
import { AiCropsComponent } from '../sections/ai-crops/ai-crops.component';
import { FinancialComponent } from '../sections/financial/financial.component';
import { InsuranceFlowComponent } from '../sections/insurance-flow/insurance-flow.component';
import { EpargneSectionComponent } from '../sections/epargne/epargne-section.component';
import { CtaComponent } from '../sections/cta/cta.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    HeroComponent,
    RiskStormComponent,
    AiCropsComponent,
    FinancialComponent,
    InsuranceFlowComponent,
    EpargneSectionComponent,
    CtaComponent,
    RouterLink
  ],
  template: `
    <!-- ── Loading Screen ───────────────────────────── -->
    <div class="loading-screen" [class.hidden]="loadingDone" id="loading-screen">
      <img src="/logo.png" alt="AgriProtect" class="loading-logo" />
      <div class="loading-progress-track">
        <div class="loading-progress-bar"></div>
      </div>
      <p class="loading-label">AgriProtect — Loading</p>
    </div>

    <!-- ── Navbar ─────────────────────────────────────── -->
    <nav class="navbar" [class.scrolled]="navScrolled" role="navigation">
      <a href="#" class="navbar-logo">
        <img src="/logo.png" alt="AgriProtect" class="nav-logo" />
      </a>
      <ul class="navbar-links">
        <li><a href="#risk">Risk</a></li>
        <li><a href="#ai">Crops</a></li>
        <li><a href="#epargne">Épargne</a></li>
        <li><a href="#financial">Finance</a></li>
        <li><a href="#insurance">Insurance</a></li>
      </ul>
      <div class="nav-actions">
        <button class="nav-btn-login" [routerLink]="['/auth/login']">LOGIN</button>
        <button class="nav-btn-register" [routerLink]="['/auth/register']">REGISTER</button>
      </div>
    </nav>

    <!-- ── Sections ───────────────────────────────────── -->
    <div class="section-wrapper">
      <app-hero></app-hero>
    </div>
    
    <div class="section-divider"></div>
    <div class="section-wrapper">
      <app-risk-storm></app-risk-storm>
    </div>

    <div class="section-divider"></div>
    <div class="section-wrapper">
      <app-ai-crops></app-ai-crops>
    </div>

    <div class="section-divider"></div>
    <div class="section-wrapper" id="epargne">
      <app-epargne-section></app-epargne-section>
    </div>

    <div class="section-divider"></div>
    <div class="section-wrapper">
      <app-financial></app-financial>
    </div>

    <div class="section-divider"></div>
    <div class="section-wrapper">
      <app-insurance-flow></app-insurance-flow>
    </div>

    <div class="section-divider"></div>
    <div class="section-wrapper">
      <app-cta></app-cta>
    </div>
  `,
  styles: [`
    :host { display: block; }
    
    .section-wrapper {
      opacity: 0;
      transform: translateY(50px) scale(0.99);
      transition: opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                  transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    .section-wrapper.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    .section-divider {
      width: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(45,106,79,0.3), rgba(61,139,110,0.5), rgba(45,106,79,0.3), transparent);
      transition: width 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      margin: 0 auto;
      position: relative;
    }

    .section-divider::after {
      content: '';
      position: absolute;
      top: -1px;
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, transparent 0%, rgba(45,106,79,0.6) 50%, transparent 100%);
      filter: blur(4px);
      opacity: 0;
      transition: opacity 1.4s ease;
    }

    .section-wrapper.visible + .section-divider {
      width: 60%;
    }
    .section-wrapper.visible + .section-divider::after {
      opacity: 1;
    }

    .nav-logo {
      height: 65px;
      width: auto;
      object-fit: contain;
      position: relative;
      z-index: 100;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
      transition: filter 0.3s ease;
    }

    .nav-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .nav-btn-login {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.25);
      color: #F0EDE8;
      padding: 8px 24px;
      font-family: 'DM Mono', monospace;
      font-size: 0.7rem;
      letter-spacing: 0.15em;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      border-radius: 2px;
      position: relative;
      overflow: hidden;
    }
    .nav-btn-login::before {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(45,106,79,0.08);
      transform: translateX(-100%);
      transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    .nav-btn-login:hover::before {
      transform: translateX(0);
    }
    .nav-btn-login:hover {
      border-color: rgba(61,139,110,0.6);
      color: #3D8B6E;
      box-shadow: 0 0 20px rgba(45,106,79,0.15);
    }

    .nav-btn-register {
      background: linear-gradient(135deg, #2D6A4F, #3D8B6E);
      border: 1px solid rgba(61,139,110,0.4);
      color: #F0EDE8;
      padding: 8px 24px;
      font-family: 'DM Mono', monospace;
      font-size: 0.7rem;
      letter-spacing: 0.15em;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      border-radius: 2px;
      box-shadow: 0 2px 12px rgba(45,106,79,0.25);
    }
    .nav-btn-register:hover {
      background: linear-gradient(135deg, #3D8B6E, #2D6A4F);
      border-color: rgba(61,139,110,0.7);
      box-shadow: 0 4px 24px rgba(45,106,79,0.4), 0 0 40px rgba(45,106,79,0.15);
      transform: translateY(-1px);
    }
  `]
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  // Navbar
  navScrolled = false;

  // Loading
  loadingDone = false;

  private lenis!: Lenis;
  private rafId!: number;

  constructor(private ngZone: NgZone) { }

  ngOnInit(): void {
    // Hide loading after fonts + first paint
    setTimeout(() => { this.loadingDone = true; }, 3000);
  }

  ngAfterViewInit(): void {
    // Smooth scroll
    this.ngZone.runOutsideAngular(() => {
      this.lenis = new Lenis({
        duration: 1.4,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });

      const raf = (time: number) => {
        this.lenis.raf(time);
        this.rafId = requestAnimationFrame(raf);
      };
      this.rafId = requestAnimationFrame(raf);
    });

    // Intersection Observer for section reveal
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.section-wrapper').forEach(section => {
      observer.observe(section);
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.navScrolled = window.scrollY > window.innerHeight * 0.85;
  }

  ngOnDestroy(): void {
    this.lenis?.destroy();
    cancelAnimationFrame(this.rafId);
  }
}

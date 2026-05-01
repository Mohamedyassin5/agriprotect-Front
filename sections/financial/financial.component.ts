import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy
} from '@angular/core';

@Component({
  selector: 'app-financial',
  standalone: true,
  template: `
    <section class="financial-section" id="financial">
      <video 
        #financeVideo 
        class="finance-video" 
        autoplay 
        [muted]="true" 
        loop 
        playsinline
        preload="auto"
      >
        <source src="money.webm" type="video/webm">
        <source src="money.mp4" type="video/mp4">
      </video>
      <div class="video-overlay"></div>

      <div class="financial-content section-content">
        <p class="section-label" [class.visible]="isVisible">04 — Financial Security</p>
        <h2 class="financial-headline reveal-text" [class.visible]="isVisible">
          <span class="word">EVERY</span>&nbsp;
          <span class="word">HARVEST.</span><br>
          <span class="word">EVERY</span>&nbsp;
          <span class="word">CENT.</span><br>
          <span class="word" style="color:var(--color-primary-light)">SECURED.</span>
        </h2>

        <div class="financial-stats">
          <div class="stat-item">
            <span class="stat-value">{{ formatNumber(savings) }}</span>
            <span class="stat-label">TND Saved in Claims</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ formatNumber(farmers) }}</span>
            <span class="stat-label">Farmers Protected</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ formatNumber(policies) }}</span>
            <span class="stat-label">Active Policies</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ coverage }}%</span>
            <span class="stat-label">Claim Success Rate</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .financial-section {
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .finance-video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
      will-change: transform;
      transform: translateZ(0);
      backface-visibility: hidden;
    }
    .video-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.55);
      z-index: 1;
    }
    .financial-content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2;
      text-align: center;
      width: 100%;
      max-width: 1200px;
      padding: 0 40px;
    }
    .financial-headline {
      font-size: clamp(32px, 4.5vw, 64px);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-white);
      margin-bottom: 40px;
    }
    .financial-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 48px;
      margin-top: 64px;
      justify-items: center;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .stat-value {
      font-family: var(--font-mono);
      font-size: clamp(40px, 5vw, 72px);
      font-weight: 500;
      color: var(--color-white);
      line-height: 1;
    }
    .stat-label {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--color-gold);
    }
    .section-label {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.35em;
      text-transform: uppercase;
      color: var(--color-primary-light);
      margin-bottom: 24px;
      opacity: 0;
      transition: opacity 0.8s;
    }
    .section-label.visible {
      opacity: 1;
    }
  `]
})
export class FinancialComponent implements AfterViewInit, OnDestroy {
  @ViewChild('financeVideo') videoRef!: ElementRef<HTMLVideoElement>;
  isVisible = false;
  savings  = 0;
  farmers  = 0;
  policies = 0;
  coverage = 0;

  private observer!: IntersectionObserver;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    if (this.videoRef?.nativeElement) {
      this.videoRef.nativeElement.play().catch(e => console.log('Finance video play failed:', e));
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.isVisible) {
          this.isVisible = true;
          this.animateCounters();
        }
      },
      { threshold: 0.2 }
    );
    this.observer.observe(this.el.nativeElement);
  }

  private animateCounters(): void {
    const targets = { savings: 4800000, farmers: 12000, policies: 9000, coverage: 97 };
    const duration = 2800;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      this.savings  = Math.round(targets.savings  * eased);
      this.farmers  = Math.round(targets.farmers  * eased);
      this.policies = Math.round(targets.policies * eased);
      this.coverage = Math.round(targets.coverage * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  formatNumber(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n.toString();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

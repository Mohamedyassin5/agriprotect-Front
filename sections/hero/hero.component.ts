import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-hero',
  standalone: true,
  template: `
    <section class="hero" id="hero">
      <video 
        autoplay 
        muted 
        loop 
        playsinline
        preload="auto"
        disablepictureinpicture
        class="hero-video"
      >
        <source src="hero.webm" type="video/webm">
        <source src="hero.mp4" type="video/mp4">
      </video>
      <div class="hero-overlay"></div>

      <div class="hero-content">
        <p class="hero-eyebrow">AgriProtect Platform — Est. Tunisia 2024</p>
        <h1 class="hero-title">
          YOUR LAND.<br>
          <span class="green">PROTECTED.</span>
        </h1>
        <p class="hero-subtitle">
          AI-powered agricultural insurance for the modern Tunisian farmer.
          Real-time risk detection. Instant digital policies. Guaranteed harvests.
        </p>
      </div>

      <div class="hero-scroll-hint">
        <div class="scroll-line"></div>
        <span>Scroll</span>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .hero { 
      position: relative; 
      width: 100vw; 
      height: 100vh; 
      overflow: hidden; 
    }
    .hero-video {
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
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, transparent 100%);
      z-index: 1;
      pointer-events: none;
    }
    .hero-content, .hero-scroll-hint {
      position: relative;
      z-index: 2;
    }
  `]
})
export class HeroComponent implements AfterViewInit {
  ngAfterViewInit() {
    const video = document.querySelector('.hero-video') as HTMLVideoElement;
    if (video) {
      video.muted = true;
      video.play().catch(e => console.warn('Autoplay blocked:', e));
    }
  }
}

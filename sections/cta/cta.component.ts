import { Component } from '@angular/core';

@Component({
  selector: 'app-cta',
  standalone: true,
  template: `
    <section class="cta-section" id="cta">
      <div class="cta-bg-glow"></div>

      <p class="cta-label">Join the Movement</p>

      <h2 class="cta-headline">
        PROTECT YOUR HARVEST.<br>
        SECURE YOUR FUTURE.
      </h2>

      <p class="cta-sub">
        Trusted by 12,400+ Tunisian farmers. Backed by AI. Powered by trust.
      </p>

      <div class="cta-divider"></div>

      <a href="#" class="cta-button" id="cta-main-button">
        <span>Join AgriProtect</span>
      </a>
    </section>

    <footer class="footer">
      <span class="footer-coords">
        36°48'N 10°11'E — ESPRIT University, Tunisia
      </span>
      <span class="footer-copyright">
        © 2024 AgriProtect. All rights reserved.
      </span>
    </footer>
  `,
  styles: [`:host { display: block; }`]
})
export class CtaComponent {}

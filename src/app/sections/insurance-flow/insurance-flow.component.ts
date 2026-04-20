import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy,
  HostListener, NgZone, ChangeDetectorRef
} from '@angular/core';
import * as THREE from 'three';
import { ThreeEngineService, SceneFactory } from '../../core/three-engine.service';

interface InsuranceState {
  label:     string;
  icon:      string;
  desc:      string;
  glowClass: string;
  labelClass: string;
  step:      string;
}

const STATES: InsuranceState[] = [
  {
    label:      'PENDING',
    icon:       '⏳',
    desc:       'Application submitted and under review by our underwriting team.',
    glowClass:  '',
    labelClass: '',
    step:       'Step 01 / 05'
  },
  {
    label:      'SIGNED',
    icon:       '✍️',
    desc:       'Digital contract signed via secure e-signature. Policy in preparation.',
    glowClass:  'glow-signed',
    labelClass: 'label-signed',
    step:       'Step 02 / 05'
  },
  {
    label:      'ACTIVE',
    icon:       '🛡️',
    desc:       'Policy in full force. Your harvest is protected from this moment.',
    glowClass:  'glow-active',
    labelClass: 'label-active',
    step:       'Step 03 / 05'
  },
  {
    label:      'OVERDUE',
    icon:       '⚠️',
    desc:       'Premium payment is past due. Please regularize to maintain coverage.',
    glowClass:  'glow-overdue',
    labelClass: 'label-overdue',
    step:       'Step 04 / 05'
  },
  {
    label:      'REGULARIZED',
    icon:       '✅',
    desc:       'Account restored. Policy automatically reactivated. Protection resumed.',
    glowClass:  'glow-regularized',
    labelClass: 'label-regularized',
    step:       'Step 05 / 05'
  }
];

function createCircleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
}

@Component({
  selector: 'app-insurance-flow',
  standalone: true,
  template: `
    <section class="insurance-section" id="insurance">
      <canvas #canvas class="scene-canvas"></canvas>

      <div class="insurance-header">
        <p class="section-label" [class.visible]="isVisible">05 — Insurance Lifecycle</p>
        <h2 class="insurance-headline reveal-text" [class.visible]="isVisible">
          <span class="word">FROM</span>&nbsp;
          <span class="word">PENDING</span>&nbsp;
          <span class="word">TO</span>&nbsp;
          <span class="word" style="color:var(--color-primary-light)">PROTECTED.</span>
        </h2>
      </div>

      <div
        class="carousel-stage"
        #stage
        [class.dragging]="isDragging"
        (mousedown)="onDragStart($event)"
        (touchstart)="onTouchStart($event)"
      >
        <div class="carousel-track">
          @for (state of states; track state.label; let i = $index) {
            <div
              class="ins-card"
              [class]="getCardClass(i)"
              [style.transform]="getCardTransform(i)"
              [style.opacity]="getCardOpacity(i)"
              [style.z-index]="getCardZIndex(i)"
              (click)="onCardClick(i)"
            >
              <span class="card-icon">{{ state.icon }}</span>
              <span class="card-status-label" [class]="state.labelClass">
                {{ state.label }}
              </span>
              <span class="card-title">{{ getCardTitle(state.label) }}</span>
              <p class="card-desc">{{ state.desc }}</p>
              <span class="card-step">{{ state.step }}</span>
            </div>
          }
        </div>
      </div>

      <p class="carousel-arrow-hint">← Drag, use keys, or wait for auto-rotate →</p>

      <div class="carousel-nav">
        @for (state of states; track state.label; let i = $index) {
          <button
            class="nav-dot"
            [class.active]="i === currentIndex"
            (click)="goTo(i)"
            [attr.aria-label]="'View ' + state.label + ' state'"
          ></button>
        }
      </div>

      <div class="carousel-info">
        <p class="carousel-info-text">{{ states[currentIndex].desc }}</p>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .insurance-header, .carousel-stage, .carousel-nav, .carousel-info, .carousel-arrow-hint {
      position: relative;
      z-index: 10;
      width: 100%;
    }
    .insurance-section {
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      background: var(--color-charcoal);
      padding-top: 100px;
      box-sizing: border-box;
      z-index: 1;
    }
    .carousel-stage {
      width: 100%;
      height: 420px;
      min-height: 400px;
      perspective: 1400px;
      perspective-origin: 50% 50%;
      user-select: none;
      cursor: grab;
      margin-top: 10px;
    }
    .carousel-stage.dragging { cursor: grabbing; }
    .carousel-track {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transform-style: preserve-3d;
      pointer-events: none;
    }
    .ins-card {
      position: absolute;
      width: 320px;
      height: 320px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 32px 24px;
      background: rgba(20, 24, 20, 0.95);
      border: 1.5px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
      transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      backdrop-filter: blur(12px);
      backface-visibility: hidden;
      pointer-events: auto;
      opacity: 1 !important;
      visibility: visible !important;
    }
    .ins-card.glow-active {
      border: 1px solid #27AE60 !important;
      box-shadow: 0 0 40px rgba(39, 174, 96, 0.6) !important;
    }
    .ins-card.glow-overdue {
      border: 1px solid #C0392B !important;
      box-shadow: 0 0 40px rgba(192, 57, 43, 0.6) !important;
    }
    .insurance-header {
      padding: 0 5%;
      margin-bottom: 30px;
      text-align: left;
    }
    .section-label {
      font-size: 0.75rem;
      letter-spacing: 0.2em;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 8px;
      text-transform: uppercase;
      font-family: var(--font-mono);
    }
    .insurance-headline {
      font-size: clamp(1.8rem, 3.5vw, 3.5rem);
      white-space: nowrap;
      margin-top: 0;
      line-height: 1.1;
    }
    .carousel-nav {
      display: flex;
      gap: 14px;
      justify-content: center;
      margin-top: 30px;
    }
    .nav-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: rgba(240, 237, 232, 0.2);
      border: none;
      cursor: pointer;
      transition: background 0.3s, transform 0.3s;
    }
    .nav-dot.active {
      background: var(--color-primary-light);
      transform: scale(1.6);
    }
    .carousel-info {
      text-align: center;
      margin-top: 15px;
      min-height: 40px;
    }
    .carousel-info-text {
      font-family: var(--font-mono);
      font-size: 12px;
      letter-spacing: 0.15em;
      color: var(--color-white-dim);
      text-transform: uppercase;
      max-width: 600px;
      margin: 0 auto;
    }
    .carousel-arrow-hint {
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 0.25em;
      color: rgba(240, 237, 232, 0.2);
      text-align: center;
      margin-top: 5px;
      margin-bottom: auto;
      text-transform: uppercase;
    }
  `]
})
export class InsuranceFlowComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stage') stageRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly states = STATES;
  currentIndex = 2;           
  isVisible = false;
  isDragging = false;

  private observer!: IntersectionObserver;
  private autoRotateTimer: any;
  private sceneDisposables: (() => void)[] = [];

  private dragStartX = 0;
  private dragCurrentX = 0;
  private dragThreshold = 60;
  private onMouseMove!: (e: MouseEvent) => void;
  private onMouseUp!: (e: MouseEvent) => void;
  private onTouchMove!: (e: TouchEvent) => void;
  private onTouchEnd!: (e: TouchEvent) => void;

  constructor(
    private engine: ThreeEngineService,
    private el: ElementRef,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    // Canvas Scene Setup
    const canvas = this.canvasRef.nativeElement;
    this.engine.registerScene(canvas, (renderer) => this.buildScene(renderer, canvas));

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.isVisible) {
          this.isVisible = true;
          this.startAutoRotate();
          this.cdr.detectChanges();
        }
      },
      { threshold: 0.2 }
    );
    this.observer.observe(this.el.nativeElement);

    this.onMouseMove = (e: MouseEvent) => this.onDragMove(e.clientX);
    this.onMouseUp   = (e: MouseEvent) => this.onDragEnd(e.clientX);
    this.onTouchMove = (e: TouchEvent) => this.onDragMove(e.touches[0].clientX);
    this.onTouchEnd  = (e: TouchEvent) => this.onDragEnd(e.changedTouches[0].clientX);

    this.currentIndex = 2;
    this.updateCarousel();

    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup',   this.onMouseUp);
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });
    window.addEventListener('touchend',  this.onTouchEnd);
  }

  private buildScene(renderer: THREE.WebGLRenderer, canvas: HTMLCanvasElement): SceneFactory {
    const scene = new THREE.Scene();
    scene.background = null; 

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);

    const circleTex = createCircleTexture();
    this.sceneDisposables.push(() => circleTex.dispose());
    
    const partsGeom = new THREE.BufferGeometry();
    const partsCount = 3000;
    const partsPos = new Float32Array(partsCount * 3);
    const partsData: any[] = [];
    for(let i = 0; i < partsCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const th = 2 * Math.PI * u;
        const ph = Math.acos(2 * v - 1);
        const rOrbit = Math.random() * 8.0;
        
        const px = rOrbit * Math.sin(ph) * Math.cos(th);
        const py = rOrbit * Math.sin(ph) * Math.sin(th);
        const pz = rOrbit * Math.cos(ph);
        
        partsPos[i*3] = px; partsPos[i*3+1] = py; partsPos[i*3+2] = pz;
        partsData.push({
            orbitMultiplier: Math.random() * 0.4,
            speed: (Math.random() - 0.5) * 0.3,
            angle: Math.random() * Math.PI * 2,
            baseX: px, baseY: py, baseZ: pz
        });
    }
    partsGeom.setAttribute('position', new THREE.BufferAttribute(partsPos, 3));
    const partsMat = new THREE.PointsMaterial({ 
        color: 0xD4A017, size: 0.03, opacity: 0.5, transparent: true,
        map: circleTex, alphaMap: circleTex, depthWrite: false
    });
    const particles = new THREE.Points(partsGeom, partsMat);
    scene.add(particles);

    this.sceneDisposables.push(() => { 
        partsGeom.dispose(); partsMat.dispose(); 
    });

    const animateFn = (delta: number, elapsed: number) => {
        camera.position.x = Math.sin(elapsed * 0.08) * 0.5;
        camera.position.y = Math.cos(elapsed * 0.08) * 0.3;
        camera.lookAt(0, 0, 0);

        const arr = partsGeom.attributes['position'].array as Float32Array;
        partsData.forEach((pd, i) => {
            pd.angle += delta * pd.speed;
            arr[i*3]   = pd.baseX + Math.cos(pd.angle) * pd.orbitMultiplier;
            arr[i*3+2] = pd.baseZ + Math.sin(pd.angle) * pd.orbitMultiplier;
        });
        partsGeom.attributes['position'].needsUpdate = true;
    };

    return {
      scene, camera, animateFn,
      dispose: () => {
        this.sceneDisposables.forEach(d => d());
      }
    };
  }

  private startAutoRotate(): void {
    this.stopAutoRotate();
    this.ngZone.runOutsideAngular(() => {
      this.autoRotateTimer = setInterval(() => {
        this.ngZone.run(() => {
          this.goTo((this.currentIndex + 1) % this.states.length);
        });
      }, 4000);
    });
  }

  private stopAutoRotate(): void {
    if (this.autoRotateTimer) {
      clearInterval(this.autoRotateTimer);
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'ArrowRight') this.goTo((this.currentIndex + 1) % this.states.length);
    if (e.key === 'ArrowLeft')  this.goTo((this.currentIndex - 1 + this.states.length) % this.states.length);
  }

  onDragStart(e: MouseEvent): void {
    e.preventDefault();
    this.stopAutoRotate();
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragCurrentX = e.clientX;
  }

  onTouchStart(e: TouchEvent): void {
    this.stopAutoRotate();
    this.isDragging = true;
    this.dragStartX = e.touches[0].clientX;
    this.dragCurrentX = e.touches[0].clientX;
  }

  private onDragMove(x: number): void {
    if (!this.isDragging) return;
    this.dragCurrentX = x;
  }

  private onDragEnd(x: number): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    const delta = this.dragStartX - x;

    if (Math.abs(delta) > this.dragThreshold) {
      if (delta > 0) {
        this.goTo((this.currentIndex + 1) % this.states.length);
      } else {
        this.goTo((this.currentIndex - 1 + this.states.length) % this.states.length);
      }
    }
    this.startAutoRotate();
  }

  onCardClick(i: number): void {
    if (Math.abs(this.dragStartX - this.dragCurrentX) < 10) {
      this.goTo(i);
    }
  }

  goTo(index: number): void {
    this.currentIndex = index;
    this.startAutoRotate();
    this.updateCarousel();
  }

  updateCarousel(): void {
    this.cdr.detectChanges();
  }

  getCardClass(i: number): string {
    const dist = this.getDist(i);
    const state = this.states[i];
    let posClass = '';

    if (dist === 0) posClass = 'state-focused';
    else if (Math.abs(dist) === 1) posClass = 'state-adjacent';
    else posClass = 'state-far';

    return `ins-card ${posClass} ${state.glowClass}`;
  }

  getCardTransform(i: number): string {
    const dist = this.getDist(i);
    const CARD_WIDTH = 300;
    const translateX = dist * CARD_WIDTH;
    let rotateY = 0, translateZ = 0, scale = 1;

    if (dist === 0) {
      rotateY = 0; translateZ = 120; scale = 1.05;
    } else if (Math.abs(dist) === 1) {
      rotateY = dist < 0 ? 40 : -40;
      translateZ = -200; scale = 0.82;
    } else {
      rotateY = dist < 0 ? 75 : -75;
      translateZ = -350; scale = 0.6;
    }
    return `translateX(${translateX}px) rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(${scale})`;
  }

  getCardOpacity(i: number): number {
    const dist = Math.abs(this.getDist(i));
    if (dist === 0) return 1;
    if (dist === 1) return 0.5;
    return 0.25;
  }

  getCardZIndex(i: number): number {
    return 10 - Math.abs(this.getDist(i));
  }

  private getDist(i: number): number {
    let diff = i - this.currentIndex;
    const half = Math.floor(this.states.length / 2);
    if (diff > half) diff -= this.states.length;
    if (diff < -half) diff += this.states.length;
    return diff;
  }

  getCardTitle(label: string): string {
    const titles: Record<string, string> = {
      PENDING:     'Under Review',
      SIGNED:      'Contract Signed',
      ACTIVE:      'Fully Protected',
      OVERDUE:     'Action Required',
      REGULARIZED: 'Coverage Restored'
    };
    return titles[label] ?? label;
  }

  ngOnDestroy(): void {
    this.stopAutoRotate();
    this.observer?.disconnect();
    this.engine.destroyScene(this.canvasRef.nativeElement);
    this.sceneDisposables.forEach(d => d());
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup',   this.onMouseUp);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend',  this.onTouchEnd);
  }
}

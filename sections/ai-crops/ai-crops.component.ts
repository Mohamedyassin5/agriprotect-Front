import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy
} from '@angular/core';
import * as THREE from 'three';
import { ThreeEngineService, SceneFactory } from '../../core/three-engine.service';

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
  selector: 'app-ai-crops',
  standalone: true,
  template: `
    <section class="ai-section" id="ai">
      <img src="/brain.png" alt="AI Brain" class="brain-bg-image" />
      <div class="video-overlay"></div>
      
      <canvas #canvas class="scene-canvas"></canvas>

      <div class="ai-content section-content">
        <h2 class="ai-headline reveal-text" [class.visible]="isVisible">
          <span class="word">AI</span>&nbsp;
          <span class="word">THAT</span>&nbsp;
          <span class="word">KNOWS</span><br>
          <span class="word">YOUR</span>&nbsp;
          <span class="word">SOIL</span>
        </h2>
        <p class="ai-desc" [style.opacity]="isVisible ? 1 : 0">
          XGBoost decision trees trained on 2M+ Tunisian harvest records
          analyze NPK levels, rainfall, and temperature to recommend
          the optimal crop — maximizing yield and minimizing risk.
        </p>
        <div class="ai-tags">
          <span class="tag">NPK Analysis</span>
          <span class="tag">Rainfall Patterns</span>
          <span class="tag">Temp Forecasting</span>
          <span class="tag">Yield Prediction</span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .ai-section {
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
    .brain-bg-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
    }
    .video-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.55);
      z-index: 1;
      pointer-events: none;
    }
    .scene-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      pointer-events: none;
    }
    .ai-content {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      max-width: 60%;
      z-index: 3;
      text-align: center;
      pointer-events: none;
    }
    .ai-desc {
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--color-white-dim);
      line-height: 1.8;
      margin: 28px auto 0;
      letter-spacing: 0.04em;
      transition: opacity 1.2s 0.8s;
      pointer-events: auto;
    }
    .ai-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 28px;
      justify-content: center;
      pointer-events: auto;
    }
    .tag {
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      padding: 8px 18px;
      border: 1px solid rgba(212,160,23,0.3);
      color: var(--color-gold);
      border-radius: 2px;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(8px);
      background: rgba(212,160,23,0.04);
    }
    .tag::before {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(212,160,23,0.1), transparent);
      transition: left 0.6s ease;
    }
    .tag:hover::before {
      left: 100%;
    }
    .tag:hover {
      border-color: rgba(212,160,23,0.6);
      box-shadow: 0 0 20px rgba(212,160,23,0.15);
      transform: translateY(-2px);
    }
  `]
})
export class AiCropsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  isVisible = false;
  private observer!: IntersectionObserver;
  private sceneDisposables: (() => void)[] = [];

  constructor(private engine: ThreeEngineService, private el: ElementRef) {}

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.engine.registerScene(canvas, (renderer) => this.buildScene(renderer, canvas));

    this.observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) this.isVisible = true; },
      { threshold: 0.2 }
    );
    this.observer.observe(this.el.nativeElement);
  }

  private buildScene(renderer: THREE.WebGLRenderer, canvas: HTMLCanvasElement): SceneFactory {
    const scene = new THREE.Scene();
    scene.background = null; 

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
    camera.position.set(0, 0, 7);
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
            orbitMultiplier: Math.random() * 0.5,
            speed: (Math.random() - 0.5) * 0.5,
            angle: Math.random() * Math.PI * 2,
            baseX: px, baseY: py, baseZ: pz
        });
    }
    partsGeom.setAttribute('position', new THREE.BufferAttribute(partsPos, 3));
    const partsMat = new THREE.PointsMaterial({ 
        color: 0xD4A017, size: 0.04, opacity: 0.5, transparent: true,
        map: circleTex, alphaMap: circleTex, depthWrite: false
    });
    const particles = new THREE.Points(partsGeom, partsMat);
    scene.add(particles);

    this.sceneDisposables.push(() => { 
        partsGeom.dispose(); partsMat.dispose(); 
    });

    const animateFn = (delta: number, elapsed: number) => {
        camera.position.x = Math.sin(elapsed * 0.12) * 1.0;
        camera.position.z = 7 + Math.cos(elapsed * 0.12) * 0.5;
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

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.engine.destroyScene(this.canvasRef.nativeElement);
  }
}

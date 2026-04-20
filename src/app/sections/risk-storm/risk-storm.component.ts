import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit
} from '@angular/core';
import * as THREE from 'three';
import { ThreeEngineService, SceneFactory } from '../../core/three-engine.service';
import gsap from 'gsap';

@Component({
  selector: 'app-risk-storm',
  standalone: true,
  template: `
    <section class="risk-section" id="risk">
      <canvas #canvas class="scene-canvas"></canvas>

      <div class="risk-content section-content">
        <p class="section-label" [class.visible]="isVisible">02 — Risk Intelligence</p>
        <h2 class="risk-headline reveal-text" [class.visible]="isVisible">
          <span class="word">WE</span>&nbsp;
          <span class="word">SEE</span>&nbsp;
          <span class="word">THE</span>&nbsp;
          <span class="word">STORM</span>&nbsp;
          <span class="word">BEFORE</span>&nbsp;
          <span class="word">IT</span>&nbsp;
          <span class="word">ARRIVES</span>
        </h2>
        <p class="risk-sub" [style.opacity]="isVisible ? 1 : 0">
          Real-time satellite imagery, atmospheric sensors, and neural weather models
          converge to protect your crops — hours before impact.
        </p>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .risk-sub {
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--color-white-dim);
      max-width: 500px;
      line-height: 1.8;
      margin-top: 32px;
      letter-spacing: 0.04em;
      transition: opacity 1.2s 0.8s;
    }
  `]
})
export class RiskStormComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  isVisible = false;
  private lightningInterval: any = null;
  private observer!: IntersectionObserver;
  private earthGroup!: THREE.Group;
  private hurricaneMesh!: THREE.Mesh;

  constructor(private engine: ThreeEngineService, private el: ElementRef) {}

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.isVisible = true;
          this.startEffects();
        } else {
          this.stopEffects();
        }
      },
      { threshold: 0.2 }
    );
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.engine.registerScene(canvas, (renderer) => this.buildScene(renderer, canvas));
    this.observer.observe(this.el.nativeElement);
  }

  private buildScene(renderer: THREE.WebGLRenderer, canvas: HTMLCanvasElement): SceneFactory {
    const scene = new THREE.Scene();
    
    // 7. CAMERA & LIGHTING
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    // 1. ZOOM OUT: Move camera to z=7
    camera.position.set(0, 0, 7); 
    camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0x112244, 0.3);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.0);
    pointLight.position.set(5, 3, 5);
    scene.add(pointLight);

    // Stronger directional light from left (sun side)
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(-5, 3, 5);
    scene.add(dirLight);

    // Globe should take up roughly 60% of screen, centered right side (x=1.5)
    this.earthGroup = new THREE.Group();
    this.earthGroup.position.x = 1.5;
    scene.add(this.earthGroup);

    // 2. REAL CONTINENTS
    const globeGeom = new THREE.SphereGeometry(2, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    const earthTex = textureLoader.load('https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg');
    
    const globeMat = new THREE.MeshPhongMaterial({
        map: earthTex,
        color: 0xffffff,
        specular: 0x111111,
        shininess: 5
    });
    const globeMesh = new THREE.Mesh(globeGeom, globeMat);
    this.earthGroup.add(globeMesh);

    // 3. HURRICANE SYSTEM (Sprite)
    const hrTex = this.createHurricaneTexture();
    const hurrGeom = new THREE.PlaneGeometry(0.5, 0.5); // About 8-10% of globe diameter
    const hurrMat = new THREE.MeshBasicMaterial({
        map: hrTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    this.hurricaneMesh = new THREE.Mesh(hurrGeom, hurrMat);
    
    // Position at Tunisia coordinates
    const lat = 34; const lon = 9;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180); 
    const r = 2.01;
    const stormPos = new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
    );
    this.hurricaneMesh.position.copy(stormPos);
    this.hurricaneMesh.lookAt(stormPos.clone().multiplyScalar(2));
    this.earthGroup.add(this.hurricaneMesh);

    // ATMOSPHERE LAYER 
    const atmoGeom = new THREE.SphereGeometry(2.05, 64, 64);
    const globeVert = `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: globeVert,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            float fresnel = 1.0 - max(dot(viewDir, normalize(vNormal)), 0.0);
            fresnel = pow(fresnel, 4.0);
            vec3 glow = vec3(0.2, 0.4, 1.0); // #3366ff
            gl_FragColor = vec4(glow * fresnel, fresnel * 0.5); 
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.earthGroup.add(new THREE.Mesh(atmoGeom, atmoMat));

    // 4. STARS BACKGROUND (increased size, count 3000, spread 80)
    const starsGeom = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPos = new Float32Array(starCount * 3);
    for(let i=0; i<starCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const th = 2 * Math.PI * u;
        const ph = Math.acos(2 * v - 1);
        const starr = 80.0;
        starPos[i*3] = starr * Math.sin(ph) * Math.cos(th);
        starPos[i*3+1] = starr * Math.sin(ph) * Math.sin(th);
        starPos[i*3+2] = starr * Math.cos(ph);
    }
    starsGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, sizeAttenuation: true });
    scene.add(new THREE.Points(starsGeom, starsMat));

    const animateFn = (delta: number, elapsed: number) => {
      // Rotation
      this.earthGroup.rotation.y += 0.0008;
      // Hurricane continuous rotation
      this.hurricaneMesh.rotation.z -= 0.005; 
    };

    return {
      scene, camera, animateFn,
      dispose: () => {
        globeGeom.dispose();
        globeMat.dispose();
        earthTex.dispose();
        atmoGeom.dispose();
        atmoMat.dispose();
        starsGeom.dispose();
        starsMat.dispose();
        hurrGeom.dispose();
        hurrMat.dispose();
        hrTex.dispose();
      }
    };
  }

  // 3. HURRICANE (Canvas generated sprite texture)
  private createHurricaneTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const cx = 128, cy = 128;
    
    // Radial glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 128);
    grad.addColorStop(0, 'rgba(255, 0, 0, 1.0)'); // Eye base red
    grad.addColorStop(0.3, 'rgba(204, 34, 0, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,256,256);

    // Spirals in white/red mix
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    
    for(let arm = 0; arm < 4; arm++) {
        ctx.beginPath();
        const offset = (Math.PI * 2 / 4) * arm;
        for(let a = 0.5; a < Math.PI * 2.5; a += 0.2) {
            const spirR = a * 14; 
            const x = cx + Math.cos(a + offset) * spirR;
            const y = cy + Math.sin(a + offset) * spirR;
            if(a === 0.5) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    return new THREE.CanvasTexture(canvas);
  }

  private startEffects(): void {
    this.startLightning();
  }

  private stopEffects(): void {
    if (this.lightningInterval) clearInterval(this.lightningInterval);
  }

  private startLightning(): void {
    const lat = 34; const lon = 9;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180); 
    const r = 2.02;
    const hurricaneCenter = new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
    );

    this.lightningInterval = setInterval(() => {
      if (!this.earthGroup) return;
      
      const cluster = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const pts = [hurricaneCenter.clone()];
        let curr = hurricaneCenter.clone();
        for (let j = 0; j < 4; j++) {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
            );
            curr = curr.clone().add(offset).normalize().multiplyScalar(2.05);
            pts.push(curr);
        }
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0 });
        cluster.add(new THREE.Line(geom, mat));
      }
      
      this.earthGroup.add(cluster);

      gsap.to(cluster.children.map((c: any) => c.material), {
          opacity: 1, duration: 0.1, yoyo: true, repeat: 1,
          onComplete: () => {
              this.earthGroup.remove(cluster);
              cluster.children.forEach((c: any) => { 
                  c.geometry.dispose(); 
                  c.material.dispose(); 
              });
          }
      });
      
    }, 3000 + Math.random() * 2000);
  }

  ngOnDestroy(): void {
    this.stopEffects();
    this.observer?.disconnect();
    this.engine.destroyScene(this.canvasRef.nativeElement);
  }
}

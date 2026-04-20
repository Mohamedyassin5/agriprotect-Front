import { Injectable, NgZone, OnDestroy } from '@angular/core';
import * as THREE from 'three';

export interface SceneEntry {
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  clock: THREE.Clock;
  animateFn: (delta: number, elapsed: number) => void;
  resizeObserver: ResizeObserver;
  intersectionObserver: IntersectionObserver;
  isVisible: boolean;
  dispose: () => void;
}

export interface SceneFactory {
  scene: THREE.Scene;
  camera: THREE.Camera;
  animateFn: (delta: number, elapsed: number) => void;
  dispose: () => void;
}

@Injectable({ providedIn: 'root' })
export class ThreeEngineService implements OnDestroy {
  private scenes = new Map<HTMLCanvasElement, SceneEntry>();
  private rafId: number | null = null;
  private isRunning = false;

  constructor(private ngZone: NgZone) {}

  /** Register a Three.js scene bound to a canvas element */
  registerScene(
    canvas: HTMLCanvasElement,
    factory: (renderer: THREE.WebGLRenderer, canvas: HTMLCanvasElement) => SceneFactory
  ): void {
    if (this.scenes.has(canvas)) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth || canvas.offsetWidth, canvas.clientHeight || canvas.offsetHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const { scene, camera, animateFn, dispose } = factory(renderer, canvas);
    const clock = new THREE.Clock();

    // ResizeObserver — keeps canvas sized to its container
    const resizeObserver = new ResizeObserver(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        const cam = camera as THREE.PerspectiveCamera;
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
      }
    });
    resizeObserver.observe(canvas.parentElement ?? canvas);

    // IntersectionObserver — pause RAF when off-screen
    let isVisible = true;
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? false;
        entry.isVisible = isVisible;
        if (isVisible && !this.isRunning) this.startLoop();
      },
      { threshold: 0.01 }
    );
    intersectionObserver.observe(canvas);

    const entry: SceneEntry = {
      canvas, scene, camera, renderer, clock, animateFn,
      resizeObserver, intersectionObserver, isVisible,
      dispose: () => {
        dispose();
        renderer.dispose();
        renderer.forceContextLoss();
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
      }
    };

    this.scenes.set(canvas, entry);

    if (!this.isRunning) this.startLoop();
  }

  /** Destroy a scene and free GPU resources */
  destroyScene(canvas: HTMLCanvasElement): void {
    const entry = this.scenes.get(canvas);
    if (!entry) return;
    entry.dispose();
    this.scenes.delete(canvas);
    if (this.scenes.size === 0) this.stopLoop();
  }

  /** Single RAF loop driving all scenes */
  private startLoop(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Run outside Angular Zone for performance
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        if (!this.isRunning) return;
        this.rafId = requestAnimationFrame(loop);

        for (const entry of this.scenes.values()) {
          if (!entry.isVisible) continue;
          const delta = entry.clock.getDelta();
          const elapsed = entry.clock.getElapsedTime();
          entry.animateFn(delta, elapsed);
          entry.renderer.render(entry.scene, entry.camera);
        }
      };
      loop();
    });
  }

  private stopLoop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  ngOnDestroy(): void {
    this.stopLoop();
    for (const canvas of this.scenes.keys()) {
      this.destroyScene(canvas);
    }
  }
}

// gold-liquid.shader.ts — Financial section molten gold FBM shader
export const GOLD_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const GOLD_FRAGMENT_SHADER = `
  uniform float u_time;
  uniform float u_progress;
  uniform vec2 u_resolution;
  varying vec2 vUv;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = dot(hash2(i + vec2(0,0))*2.0-1.0, f - vec2(0,0));
    float b = dot(hash2(i + vec2(1,0))*2.0-1.0, f - vec2(1,0));
    float c = dot(hash2(i + vec2(0,1))*2.0-1.0, f - vec2(0,1));
    float d = dot(hash2(i + vec2(1,1))*2.0-1.0, f - vec2(1,1));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // Fractal Brownian Motion — layered gold
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for(int i = 0; i < 7; i++) {
      v += a * noise(p);
      p = rot * p * 2.1;
      a *= 0.48;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = u_time * 0.25;

    // Domain warping for molten liquid effect
    vec2 q = vec2(fbm(uv * 2.0 + t), fbm(uv * 2.0 + vec2(1.7, 9.2) + t * 0.8));
    vec2 r = vec2(fbm(uv * 3.0 + 4.0 * q + vec2(1.7, 9.2) + t * 0.3),
                  fbm(uv * 3.0 + 4.0 * q + vec2(8.3, 2.8) + t * 0.5));

    float f = fbm(uv * 2.0 + 4.0 * r);
    f = f * 0.5 + 0.5;

    // Gold palette: deep amber → bright gold → near-white reflection
    vec3 darkGold   = vec3(0.20, 0.10, 0.00);
    vec3 midGold    = vec3(0.83, 0.63, 0.09);  // #D4A017
    vec3 brightGold = vec3(0.95, 0.83, 0.42);
    vec3 highlight  = vec3(1.00, 0.97, 0.88);

    vec3 col = mix(darkGold, midGold, f);
    col = mix(col, brightGold, pow(f, 2.0) * 0.8);
    col = mix(col, highlight, pow(f, 4.0) * 0.4);

    // Progress-driven reveal — gold floods in from bottom
    float revealMask = smoothstep(1.0 - u_progress, 1.0 - u_progress + 0.4, uv.y);
    col = mix(vec3(0.04, 0.04, 0.03), col, revealMask);

    // Vignette
    float vig = 1.0 - smoothstep(0.4, 1.2, length((uv - 0.5) * 1.5));
    col *= 0.6 + vig * 0.4;

    gl_FragColor = vec4(col, 1.0);
  }
`;

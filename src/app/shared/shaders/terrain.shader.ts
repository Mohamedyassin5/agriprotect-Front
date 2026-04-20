export const SKY_FRAG = `
  uniform float u_time;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = 50.0 * fract( p * 0.3183099 + vec2(0.71, 0.113));
    return -1.0 + 2.0 * fract( p.x * p.y * (p.x + p.y) );
  }

  float noise(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix( mix( hash( i + vec2(0.0,0.0) ), 
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ), 
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
  }

  void main() {
    float h = vUv.y;
    vec3 colTop = vec3(0.04, 0.04, 0.10); // #0a0a1a
    vec3 colMid = vec3(0.55, 0.15, 0.00); // #8B2500
    vec3 colBot = vec3(0.83, 0.35, 0.04); // #D4580A

    vec3 skyColor;
    if (h > 0.35) {
        skyColor = mix(colMid, colTop, smoothstep(0.35, 1.0, h));
    } else {
        skyColor = mix(colBot, colMid, smoothstep(0.0, 0.35, h));
    }

    float n = fbm(vUv * vec2(4.0, 1.5) + vec2(u_time * 0.02, 0.0));
    skyColor += n * 0.15;

    vec2 pos = vUv;
    pos.y *= 1.5; 
    float distToSun = length(pos - vec2(0.65, 0.35 * 1.5));
    float sunGlow = smoothstep(0.20, 0.0, distToSun);
    vec3 sunColor = vec3(1.0, 0.55, 0.00); // #FF8C00
    skyColor = mix(skyColor, sunColor, sunGlow * 0.6);

    gl_FragColor = vec4(skyColor, 1.0);
  }
`;

export const STALK_VERT = `
  uniform float u_time;
  attribute float aRandom;
  attribute float aSway;
  attribute float aOpacity;
  varying vec2 vUv;
  varying float vAlpha;

  void main() {
    vUv = uv;
    vAlpha = aOpacity;
    vec3 pos = position; 
    
    float h = max(pos.y, 0.0);
    float angle = sin(u_time * 0.8 + aRandom) * aSway * h; 

    float s = sin(angle);
    float c = cos(angle);
    mat2 rot = mat2(c, -s, s, c);
    
    pos.xy = rot * pos.xy;
    
    vec4 worldPos = instanceMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const STALK_FRAG = `
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(0.05, 0.03, 0.00, vAlpha); // #0D0800 dark silhouette
  }
`;

export const GROUND_FRAG = `
  varying vec2 vUv;

  float hash(vec2 p) {
    p = 50.0 * fract( p * 0.3183099 + vec2(0.71, 0.113));
    return -1.0 + 2.0 * fract( p.x * p.y * (p.x + p.y) );
  }

  float noise(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix( mix( hash( i + vec2(0.0,0.0) ), 
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ), 
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
  }

  void main() {
    float n = noise(vUv * 20.0);
    vec3 earth = vec3(0.05, 0.04, 0.00); // #0D0A00
    earth += n * 0.015; 
    gl_FragColor = vec4(earth, 1.0);
  }
`;

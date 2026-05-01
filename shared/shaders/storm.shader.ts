// storm.shader.ts — Risk section storm cloud fragment shader
export const STORM_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const STORM_FRAGMENT_SHADER = `
  uniform float u_time;
  uniform float u_progress;
  uniform vec2 u_resolution;
  varying vec2 vUv;

  vec3 hash3(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p.zxy, p.yxz + 19.19);
    return fract(vec3(p.x * p.y, p.z * p.x, p.y * p.z));
  }

  float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(mix(dot(hash3(i + vec3(0,0,0))*2.0-1.0, f - vec3(0,0,0)),
              dot(hash3(i + vec3(1,0,0))*2.0-1.0, f - vec3(1,0,0)), f.x),
          mix(dot(hash3(i + vec3(0,1,0))*2.0-1.0, f - vec3(0,1,0)),
              dot(hash3(i + vec3(1,1,0))*2.0-1.0, f - vec3(1,1,0)), f.x), f.y),
      mix(mix(dot(hash3(i + vec3(0,0,1))*2.0-1.0, f - vec3(0,0,1)),
              dot(hash3(i + vec3(1,0,1))*2.0-1.0, f - vec3(1,0,1)), f.x),
          mix(dot(hash3(i + vec3(0,1,1))*2.0-1.0, f - vec3(0,1,1)),
              dot(hash3(i + vec3(1,1,1))*2.0-1.0, f - vec3(1,1,1)), f.x), f.y), f.z
    );
  }

  float fbm3D(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for(int i = 0; i < 6; i++) {
      v += a * noise3D(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = u_time * 0.15;

    // 3D volumetric cloud noise
    vec3 cloudPos = vec3(uv * 3.0 + vec2(t * 0.3, t * 0.1), t * 0.5);
    float cloud = fbm3D(cloudPos);
    cloud = cloud * 0.5 + 0.5;

    // Storm density driven by scroll progress
    float density = smoothstep(0.3, 0.8, cloud) * (0.4 + u_progress * 0.6);

    // Dark stormy palette
    vec3 stormDark  = vec3(0.02, 0.02, 0.04);
    vec3 stormMid   = vec3(0.06, 0.07, 0.10);
    vec3 stormLight = vec3(0.14, 0.15, 0.20);

    vec3 stormColor = mix(stormDark, mix(stormMid, stormLight, cloud), density);

    // Amber underglow near horizon
    float glow = smoothstep(0.0, 0.35, 1.0 - uv.y) * 0.4 * u_progress;
    stormColor = mix(stormColor, vec3(0.45, 0.28, 0.04), glow);

    gl_FragColor = vec4(stormColor, 1.0);
  }
`;

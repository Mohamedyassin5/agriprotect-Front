// fresnel.shader.ts — AI section iridescent edge glow for node spheres
export const FRESNEL_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-worldPos.xyz);
    gl_Position = projectionMatrix * worldPos;
  }
`;

export const FRESNEL_FRAGMENT_SHADER = `
  uniform float u_time;
  uniform float u_progress;
  uniform vec3 u_color;
  uniform float u_glowIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;

  void main() {
    // Fresnel rim
    float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    fresnel = pow(fresnel, 2.5);

    // Iridescent color shift using time
    float hueShift = u_time * 0.3 + vUv.x * 0.5;
    vec3 rimColor1 = vec3(0.18, 0.42, 0.31);   // forest green #2D6A4F
    vec3 rimColor2 = vec3(0.27, 0.68, 0.42);   // bright green
    vec3 rimColor3 = vec3(0.85, 0.97, 0.90);   // near-white green shimmer

    float t1 = sin(hueShift) * 0.5 + 0.5;
    float t2 = sin(hueShift + 2.094) * 0.5 + 0.5;
    vec3 iridescent = mix(mix(rimColor1, rimColor2, t1), rimColor3, t2 * 0.4);

    // Base sphere color
    vec3 baseColor = mix(vec3(0.06, 0.08, 0.06), u_color, 0.3);

    // Combine
    vec3 finalColor = baseColor + iridescent * fresnel * (1.5 + u_glowIntensity * 2.0);

    float alpha = 0.2 + fresnel * 0.8;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

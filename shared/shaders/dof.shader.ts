// dof.shader.ts — Insurance section fake Depth-of-Field blur
export const DOF_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const DOF_FRAGMENT_SHADER = `
  uniform float u_time;
  uniform float u_progress;
  uniform float u_focus;     // 0-1, which card is focused
  uniform vec3  u_color;
  uniform float u_glowState; // 0=normal, 1=active(green), 2=overdue(red)
  varying vec2 vUv;

  void main() {
    // Distance from focused card drives blur strength
    float distFromFocus = abs(u_focus);
    float blurAmount = smoothstep(0.0, 0.4, distFromFocus);

    // Card base color — dark glass
    vec3 cardColor = vec3(0.07, 0.08, 0.07);

    // Edge glow based on state
    vec3 glowColor = u_color;
    if(u_glowState > 0.5 && u_glowState < 1.5) {
      glowColor = vec3(0.15, 0.68, 0.38); // green - ACTIVE
    } else if(u_glowState > 1.5) {
      glowColor = vec3(0.75, 0.22, 0.17); // red - OVERDUE
    }

    // Edge detection for glow
    float edgeX = min(vUv.x, 1.0 - vUv.x);
    float edgeY = min(vUv.y, 1.0 - vUv.y);
    float edge = 1.0 - smoothstep(0.0, 0.05, min(edgeX, edgeY));

    // DoF brightness reduction
    float brightness = 1.0 - blurAmount * 0.65;

    vec3 finalColor = mix(cardColor * brightness, glowColor, edge * (1.0 - blurAmount * 0.8));

    // Scanline detail on card
    float scanline = 0.97 + 0.03 * sin(vUv.y * 80.0);
    finalColor *= scanline;

    // Alpha: focused card is fully opaque, others fade
    float alpha = 0.85 - blurAmount * 0.4;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

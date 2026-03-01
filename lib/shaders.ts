/**
 * Vertex shader — full-screen quad.
 * The caller provides two triangles that cover clip space [-1, 1].
 */
export const VERTEX_SHADER = /* glsl */ `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

/**
 * Fragment shader — Gaussian-weighted blend in OKLab color space,
 * with optional distortion, swirl, grain, scale, rotation, and offset.
 *
 * UV transformation pipeline (applied before blending):
//  *   1. offset      — translate the UV
 *   2. rotation    — rotate around canvas center
 *   3. scale       — zoom from canvas center
 *   4. distortion  — warp with layered noise (fbm-style)
 *   4b. wave       — structured sine wave warp (waveX/Y + shift)
 *   5. swirl       — vortex rotation scaled by distance from center
 *   6. warpGrain  — perturb blending UVs with noise at color boundaries
 *
 * Post-processing:
 *   7. edgeGrain — dark particle grain concentrated at color transition zones
 */
export const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  #define MAX_POINTS 16
  #define PI 3.14159265358979323846

  uniform vec2  u_resolution;
  uniform int   u_numPoints;
  uniform vec2  u_positions[MAX_POINTS];   // normalized [0,1]
  uniform vec3  u_colors[MAX_POINTS];      // linear RGB [0,1]
  uniform float u_opacities[MAX_POINTS];   // [0,1]
  uniform float u_sigmas[MAX_POINTS];      // Gaussian σ in normalized units
  uniform vec3  u_background;              // linear RGB [0,1]

  // Effect uniforms
  uniform float u_distortion;   // 0–1
  uniform float u_waveX;        // 0–1
  uniform float u_waveXShift;   // 0–1
  uniform float u_waveY;        // 0–1
  uniform float u_waveYShift;   // 0–1
  uniform float u_swirl;        // 0–1
  uniform float u_warpGrain;  // 0–1
  uniform float u_edgeGrain;  // 0–1
  uniform float u_scale;        // 0.01–4
  uniform float u_rotation;     // radians
  uniform vec2  u_offset;       // -1 to 1
  uniform float u_vibrance;     // 0.5–2, chroma multiplier

  // --- Color space helpers ---------------------------------------------------

  float srgbToLinear(float c) {
    return c <= 0.04045
      ? c / 12.92
      : pow((c + 0.055) / 1.055, 2.4);
  }

  vec3 srgbToLinearV(vec3 c) {
    return vec3(srgbToLinear(c.r), srgbToLinear(c.g), srgbToLinear(c.b));
  }

  float linearToSrgb(float c) {
    c = clamp(c, 0.0, 1.0);
    return c <= 0.0031308
      ? c * 12.92
      : 1.055 * pow(c, 1.0 / 2.4) - 0.055;
  }

  vec3 linearToSrgbV(vec3 c) {
    return vec3(linearToSrgb(c.r), linearToSrgb(c.g), linearToSrgb(c.b));
  }

  vec3 linearRgbToOklab(vec3 c) {
    float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
    float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
    float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;

    float l_ = pow(max(l, 0.0), 1.0 / 3.0);
    float m_ = pow(max(m, 0.0), 1.0 / 3.0);
    float s_ = pow(max(s, 0.0), 1.0 / 3.0);

    return vec3(
      0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
      1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
      0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    );
  }

  vec3 oklabToLinearRgb(vec3 c) {
    float l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
    float m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
    float s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;

    float l = l_ * l_ * l_;
    float m = m_ * m_ * m_;
    float s = s_ * s_ * s_;

    return vec3(
       4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    );
  }

  // --- Noise helpers ---------------------------------------------------------

  // Hash-based pseudo-random float in [0,1) — for UV-space noise (fbm, vnoise)
  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }

  // Grain hash — sin-based, no periodicity with integer pixel coords.
  // The standard fract-multiply hash cycles every 10px with half-integer
  // gl_FragCoord inputs; sin avoids that completely.
  float grainHash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Value noise: smooth interpolation between hashed lattice points
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f); // smoothstep
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // Fractional Brownian Motion — layered octaves of value noise
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 5; i++) {
      v   += amp * vnoise(p * freq);
      amp  *= 0.5;
      freq *= 2.1;
    }
    return v;
  }

  // ---------------------------------------------------------------------------

  void main() {
    vec2 uv = vec2(
      gl_FragCoord.x / u_resolution.x,
      1.0 - gl_FragCoord.y / u_resolution.y
    );

    float aspect = u_resolution.x / u_resolution.y;

    // --- UV transform pipeline ---

    // 1. Offset (translate)
    uv -= u_offset * 0.5;

    // 2. Rotate around center
    if (u_rotation != 0.0) {
      vec2 centered = uv - 0.5;
      float cosR = cos(u_rotation);
      float sinR = sin(u_rotation);
      centered = vec2(
        cosR * centered.x - sinR * centered.y * (1.0 / aspect),
        sinR * centered.x * aspect + cosR * centered.y
      );
      uv = centered + 0.5;
    }

    // 3. Scale from center
    if (u_scale != 1.0) {
      uv = (uv - 0.5) / u_scale + 0.5;
    }

    // 4. Distortion — fbm-based warp
    if (u_distortion > 0.0) {
      float strength = u_distortion * 0.35;
      vec2 warpSeed = uv * 3.5;
      float dx = fbm(warpSeed + vec2(1.7, 9.2)) - 0.5;
      float dy = fbm(warpSeed + vec2(8.3, 2.8)) - 0.5;
      uv += vec2(dx, dy) * strength;
    }

    // 4b. Wave distortion — structured sine warp
    if (u_waveX > 0.0 || u_waveY > 0.0) {
      uv.x += sin(uv.y * PI * 4.0 + u_waveXShift * PI * 2.0) * u_waveX * 0.15;
      uv.y += sin(uv.x * PI * 4.0 + u_waveYShift * PI * 2.0) * u_waveY * 0.15;
    }

    // 5. Swirl — vortex rotation scaled by distance from center
    if (u_swirl > 0.0) {
      vec2 d = uv - 0.5;
      d.x *= aspect;
      float dist = length(d);
      float angle = u_swirl * 4.0 * (1.0 - smoothstep(0.0, 0.7, dist));
      float cosA = cos(angle);
      float sinA = sin(angle);
      vec2 rotated = vec2(
        cosA * d.x - sinA * d.y,
        sinA * d.x + cosA * d.y
      );
      rotated.x /= aspect;
      uv = rotated + 0.5;
    }

    // --- Gaussian blending ---

    // 6. warpGrain: perturb the UV used for distance calculations,
    //    creating organic noise on color boundaries
    vec2 blendUv = uv;
    if (u_warpGrain > 0.0) {
      float gm = u_warpGrain * 0.12;
      blendUv.x += (fbm(uv * 8.0 + vec2(3.1, 7.4)) - 0.5) * gm;
      blendUv.y += (fbm(uv * 8.0 + vec2(9.6, 1.2)) - 0.5) * gm;
    }

    vec3  labSum         = vec3(0.0);
    float rawWeightSum   = 0.0;
    float sharpWeightSum = 0.0;
    float maxW           = 0.0;

    float sharpness = 1.0;

    for (int i = 0; i < MAX_POINTS; i++) {
      if (i >= u_numPoints) break;

      vec2  diff = blendUv - u_positions[i];
      diff.x    *= aspect;

      float d2  = dot(diff, diff);
      float sig = u_sigmas[i];
      float raw = u_opacities[i] * exp(-d2 / (2.0 * sig * sig));
      float w   = pow(raw, sharpness);

      maxW            = max(maxW, w);
      rawWeightSum   += raw;
      sharpWeightSum += w;
      labSum         += w * linearRgbToOklab(u_colors[i]);
    }

    // Spray factor: how contested this pixel is between multiple blob colors.
    // dominance → 1 when a single blob wins cleanly (blob center) → no grain.
    // dominance → 0 when blobs compete equally (color boundary) → full grain.
    // Masked by rawWeightSum so grain stays zero in pure background.
    float dominance   = (sharpWeightSum > 0.0001) ? clamp(maxW / sharpWeightSum, 0.0, 1.0) : 1.0;
    float competition = 1.0 - dominance;
    float sprayFactor = competition * competition * clamp(rawWeightSum * 4.0, 0.0, 1.0);

    vec3 bgLab = linearRgbToOklab(u_background);

    vec3 finalLab;
    float alpha = clamp(rawWeightSum, 0.0, 1.0);
    if (sharpWeightSum < 0.0001) {
      finalLab = bgLab;
    } else {
      vec3 blendedLab = labSum / sharpWeightSum;
      finalLab = mix(bgLab, blendedLab, alpha);
    }

    finalLab.y *= u_vibrance;
    finalLab.z *= u_vibrance;

    // 7. edgeGrain: lightness-only spray grain in OKLab, so hue and saturation
    //    are never touched. Grain pixels are always the same colour as their
    //    neighbours — just randomly brighter. Applied before sRGB conversion
    //    so the variation is perceptually uniform.
    if (u_edgeGrain > 0.0) {
      float grain = grainHash(gl_FragCoord.xy);
      finalLab.x = clamp(finalLab.x + grain * u_edgeGrain * sprayFactor * 0.5, 0.0, 1.0);
    }

    vec3 linear = oklabToLinearRgb(finalLab);
    vec3 color  = linearToSrgbV(linear);

    gl_FragColor = vec4(color, 1.0);
  }
`;

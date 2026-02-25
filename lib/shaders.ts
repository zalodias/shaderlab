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
 * Fragment shader — Gaussian-weighted blend in OKLab color space.
 *
 * For every pixel:
 *   1. Convert each control-point sRGB color → linear RGB → OKLab.
 *   2. Compute a Gaussian weight:  w_i = opacity_i * exp(-d² / (2σ²))
 *      where d is aspect-corrected distance and σ derives from the point's radius.
 *   3. Accumulate weighted OKLab colors; track total weight.
 *   4. Blend the weighted-average Lab color with the background Lab color,
 *      scaling by clamp(totalWeight, 0, 1).
 *   5. Convert back: OKLab → linear RGB → sRGB gamma.
 */
export const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  #define MAX_POINTS 16

  uniform vec2  u_resolution;
  uniform int   u_numPoints;
  uniform vec2  u_positions[MAX_POINTS];   // normalized [0,1]
  uniform vec3  u_colors[MAX_POINTS];      // linear RGB [0,1]
  uniform float u_opacities[MAX_POINTS];   // [0,1]
  uniform float u_sigmas[MAX_POINTS];      // Gaussian σ in normalized units
  uniform vec3  u_background;              // linear RGB [0,1]

  // --- Color space helpers ---------------------------------------------------

  // sRGB → linear RGB (inverse gamma)
  float srgbToLinear(float c) {
    return c <= 0.04045
      ? c / 12.92
      : pow((c + 0.055) / 1.055, 2.4);
  }

  vec3 srgbToLinearV(vec3 c) {
    return vec3(srgbToLinear(c.r), srgbToLinear(c.g), srgbToLinear(c.b));
  }

  // linear RGB → sRGB (gamma encode)
  float linearToSrgb(float c) {
    c = clamp(c, 0.0, 1.0);
    return c <= 0.0031308
      ? c * 12.92
      : 1.055 * pow(c, 1.0 / 2.4) - 0.055;
  }

  vec3 linearToSrgbV(vec3 c) {
    return vec3(linearToSrgb(c.r), linearToSrgb(c.g), linearToSrgb(c.b));
  }

  // linear RGB → OKLab
  // Reference: https://bottosson.github.io/posts/oklab/
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

  // OKLab → linear RGB
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

  // ---------------------------------------------------------------------------

  void main() {
    // UV in [0,1], Y flipped to match top-left origin convention
    vec2 uv = vec2(
      gl_FragCoord.x / u_resolution.x,
      1.0 - gl_FragCoord.y / u_resolution.y
    );

    float aspect = u_resolution.x / u_resolution.y;

    vec3  labSum     = vec3(0.0);
    float weightSum  = 0.0;

    for (int i = 0; i < MAX_POINTS; i++) {
      if (i >= u_numPoints) break;

      vec2  diff = uv - u_positions[i];
      diff.x    *= aspect; // aspect-correct distance

      float d2  = dot(diff, diff);
      float sig = u_sigmas[i];
      float w   = u_opacities[i] * exp(-d2 / (2.0 * sig * sig));

      labSum    += w * linearRgbToOklab(u_colors[i]);
      weightSum += w;
    }

    vec3 bgLab = linearRgbToOklab(u_background);

    vec3 finalLab;
    if (weightSum < 0.0001) {
      finalLab = bgLab;
    } else {
      vec3 blendedLab = labSum / weightSum;
      float alpha = clamp(weightSum, 0.0, 1.0);
      finalLab = mix(bgLab, blendedLab, alpha);
    }

    vec3 linear = oklabToLinearRgb(finalLab);
    gl_FragColor = vec4(linearToSrgbV(linear), 1.0);
  }
`;

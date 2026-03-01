import { hexToRgb } from "./color-utils";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shaders";
import { GradientConfig } from "./types";

const MAX_POINTS = 16;

// Full-screen quad: two triangles covering clip space [-1, 1]
const QUAD_VERTS = new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
  -1,  1,
   1, -1,
   1,  1,
]);

function srgbToLinear(c: number): number {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error:\n${info}`);
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertSrc: string,
  fragSrc: string
): WebGLProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);

  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error:\n${info}`);
  }

  gl.deleteShader(vert);
  gl.deleteShader(frag);

  return program;
}

export class WebGLGradientRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private quadBuffer: WebGLBuffer;

  // Cached uniform locations — point data
  private u_resolution: WebGLUniformLocation;
  private u_numPoints: WebGLUniformLocation;
  private u_positions: WebGLUniformLocation;
  private u_colors: WebGLUniformLocation;
  private u_opacities: WebGLUniformLocation;
  private u_sigmas: WebGLUniformLocation;
  private u_background: WebGLUniformLocation;

  // Cached uniform locations — effects
  private u_distortion: WebGLUniformLocation;
  private u_waveX: WebGLUniformLocation;
  private u_waveXShift: WebGLUniformLocation;
  private u_waveY: WebGLUniformLocation;
  private u_waveYShift: WebGLUniformLocation;
  private u_swirl: WebGLUniformLocation;
  private u_warpGrain: WebGLUniformLocation;
  private u_edgeGrain: WebGLUniformLocation;
  private u_scale: WebGLUniformLocation;
  private u_rotation: WebGLUniformLocation;
  private u_offset: WebGLUniformLocation;
  private u_vibrance: WebGLUniformLocation;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", {
      preserveDrawingBuffer: true,
      antialias: false,
      alpha: false,
    }) as WebGLRenderingContext | null;

    if (!gl) throw new Error("WebGL not supported");
    this.gl = gl;

    this.program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    gl.useProgram(this.program);

    // Upload quad geometry
    const buf = gl.createBuffer();
    if (!buf) throw new Error("Failed to create vertex buffer");
    this.quadBuffer = buf;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTS, gl.STATIC_DRAW);

    // Bind vertex attribute
    const aPos = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string): WebGLUniformLocation => {
      const loc = gl.getUniformLocation(this.program, name);
      if (loc === null) throw new Error(`Uniform "${name}" not found`);
      return loc;
    };

    this.u_resolution  = u("u_resolution");
    this.u_numPoints   = u("u_numPoints");
    this.u_positions   = u("u_positions[0]");
    this.u_colors      = u("u_colors[0]");
    this.u_opacities   = u("u_opacities[0]");
    this.u_sigmas      = u("u_sigmas[0]");
    this.u_background  = u("u_background");

    this.u_distortion   = u("u_distortion");
    this.u_waveX        = u("u_waveX");
    this.u_waveXShift   = u("u_waveXShift");
    this.u_waveY        = u("u_waveY");
    this.u_waveYShift   = u("u_waveYShift");
    this.u_swirl        = u("u_swirl");
    this.u_warpGrain = u("u_warpGrain");
    this.u_edgeGrain = u("u_edgeGrain");
    this.u_scale        = u("u_scale");
    this.u_rotation     = u("u_rotation");
    this.u_offset       = u("u_offset");
    this.u_vibrance     = u("u_vibrance");
  }

  render(config: GradientConfig): void {
    const { gl } = this;
    const canvas = gl.canvas as HTMLCanvasElement;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(this.u_resolution, canvas.width, canvas.height);

    // --- Background ---
    const bgRgb = hexToRgb(config.backgroundColor);
    if (bgRgb) {
      gl.uniform3f(
        this.u_background,
        srgbToLinear(bgRgb.r),
        srgbToLinear(bgRgb.g),
        srgbToLinear(bgRgb.b)
      );
    } else {
      gl.uniform3f(this.u_background, 1.0, 1.0, 1.0);
    }

    // --- Points ---
    const points = config.points.slice(0, MAX_POINTS);
    const n = points.length;

    const positions = new Float32Array(MAX_POINTS * 2);
    const colors    = new Float32Array(MAX_POINTS * 3);
    const opacities = new Float32Array(MAX_POINTS);
    const sigmas    = new Float32Array(MAX_POINTS);

    for (let i = 0; i < n; i++) {
      const p = points[i];
      positions[i * 2]     = p.x;
      positions[i * 2 + 1] = p.y;

      const rgb = hexToRgb(p.color);
      if (rgb) {
        colors[i * 3]     = srgbToLinear(rgb.r);
        colors[i * 3 + 1] = srgbToLinear(rgb.g);
        colors[i * 3 + 2] = srgbToLinear(rgb.b);
      }

      opacities[i] = p.opacity;
      sigmas[i]    = Math.max(p.radius * 0.35, 0.01);
    }

    gl.uniform1i(this.u_numPoints, n);
    gl.uniform2fv(this.u_positions, positions);
    gl.uniform3fv(this.u_colors, colors);
    gl.uniform1fv(this.u_opacities, opacities);
    gl.uniform1fv(this.u_sigmas, sigmas);

    // --- Effects ---
    const e = config.effects;
    gl.uniform1f(this.u_distortion,   e.distortion ?? 0);
    gl.uniform1f(this.u_waveX,        e.waveX ?? 0);
    gl.uniform1f(this.u_waveXShift,   e.waveXShift ?? 0);
    gl.uniform1f(this.u_waveY,        e.waveY ?? 0);
    gl.uniform1f(this.u_waveYShift,   e.waveYShift ?? 0);
    gl.uniform1f(this.u_swirl,        e.swirl ?? 0);
    gl.uniform1f(this.u_warpGrain, e.warpGrain ?? 0);
    gl.uniform1f(this.u_edgeGrain, e.edgeGrain ?? 0);
    gl.uniform1f(this.u_scale,        e.scale ?? 1);
    gl.uniform1f(this.u_rotation,     ((e.rotation ?? 0) * Math.PI) / 180);
    gl.uniform2f(this.u_offset,       e.offsetX ?? 0, e.offsetY ?? 0);
    gl.uniform1f(this.u_vibrance,     e.vibrance ?? 1);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /**
   * Render to an offscreen canvas at a specific resolution and return it.
   * Used for PNG export.
   */
  static renderExport(
    config: GradientConfig,
    width: number,
    height: number
  ): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const renderer = new WebGLGradientRenderer(canvas);
    renderer.render(config);
    renderer.destroy();
    return canvas;
  }

  destroy(): void {
    const { gl } = this;
    gl.deleteProgram(this.program);
    gl.deleteBuffer(this.quadBuffer);
  }
}

import { GradientConfig } from "./types";
import { hexToRgb } from "./color-utils";

/**
 * Render a mesh gradient onto a canvas element.
 * Each ColorPoint produces a radial gradient blob that blends with the others
 * through additive alpha compositing, producing smooth organic colour transitions.
 */
export function renderGradient(
  canvas: HTMLCanvasElement,
  config: GradientConfig
): void {
  const { points, backgroundColor } = config;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = canvas;
  const maxDim = Math.max(width, height);

  // Clear and fill background
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Draw each colour blob
  for (const point of points) {
    const cx = point.x * width;
    const cy = point.y * height;
    const r = point.radius * maxDim;

    const rgb = hexToRgb(point.color);
    if (!rgb) continue;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);

    // Center stop: full colour at point opacity
    gradient.addColorStop(
      0,
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${point.opacity})`
    );
    // Mid stop: softer falloff
    gradient.addColorStop(
      0.4,
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${point.opacity * 0.6})`
    );
    // Outer stop: transparent
    gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = "source-over";
}

/**
 * Render the gradient to an offscreen canvas at a specific resolution
 * and return it (used for export).
 */
export function renderToOffscreenCanvas(
  config: GradientConfig,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  renderGradient(canvas, config);
  return canvas;
}

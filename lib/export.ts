import { GradientConfig } from "./types";
import { hexToRgb } from "./color-utils";
import { renderToOffscreenCanvas } from "./gradient-renderer";

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export as PNG at the given resolution */
export async function exportPng(
  config: GradientConfig,
  width: number,
  height: number,
  filename = "gradient.png"
): Promise<void> {
  const canvas = renderToOffscreenCanvas(config, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Failed to create PNG blob"));
      const url = URL.createObjectURL(blob);
      triggerDownload(url, filename);
      resolve();
    }, "image/png");
  });
}

/** Export as SVG using layered radialGradient elements */
export function exportSvg(
  config: GradientConfig,
  width: number,
  height: number,
  filename = "gradient.svg"
): void {
  const { points, backgroundColor } = config;
  const maxDim = Math.max(width, height);

  const defs = points
    .map((p, i) => {
      const cx = p.x * width;
      const cy = p.y * height;
      const r = p.radius * maxDim;
      const rgb = hexToRgb(p.color);
      if (!rgb) return "";
      const { r: rv, g, b } = rgb;
      return `
    <radialGradient id="g${i}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="rgb(${rv},${g},${b})" stop-opacity="${p.opacity}" />
      <stop offset="40%"  stop-color="rgb(${rv},${g},${b})" stop-opacity="${(p.opacity * 0.6).toFixed(3)}" />
      <stop offset="100%" stop-color="rgb(${rv},${g},${b})" stop-opacity="0" />
    </radialGradient>`;
    })
    .join("\n");

  const rects = points
    .map((p, i) => {
      const cx = p.x * width;
      const cy = p.y * height;
      const r = p.radius * maxDim;
      return `  <ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${r.toFixed(1)}" ry="${r.toFixed(1)}" fill="url(#g${i})" />`;
    })
    .join("\n");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
${defs}
  </defs>
  <rect width="${width}" height="${height}" fill="${backgroundColor}" />
${rects}
</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
}

/** Export as a CSS background property snippet */
export function exportCss(config: GradientConfig, filename = "gradient.css"): void {
  const { points, backgroundColor } = config;

  const gradients = points
    .map((p) => {
      const rgb = hexToRgb(p.color);
      if (!rgb) return "";
      const { r, g, b } = rgb;
      const cx = (p.x * 100).toFixed(1) + "%";
      const cy = (p.y * 100).toFixed(1) + "%";
      const size = (p.radius * 100).toFixed(1) + "%";
      return `radial-gradient(ellipse ${size} ${size} at ${cx} ${cy}, rgba(${r},${g},${b},${p.opacity.toFixed(2)}) 0%, rgba(${r},${g},${b},${(p.opacity * 0.6).toFixed(2)}) 40%, transparent 100%)`;
    })
    .filter(Boolean);

  const css = `.mesh-gradient {\n  background-color: ${backgroundColor};\n  background-image:\n    ${gradients.join(",\n    ")};\n}\n`;
  const blob = new Blob([css], { type: "text/css" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
}

/** Export as JSON (re-importable GradientConfig) */
export function exportJson(config: GradientConfig, filename = "gradient.json"): void {
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
}

/** Import from JSON – validates shape */
export function importJson(json: string): GradientConfig | null {
  try {
    const obj = JSON.parse(json);
    if (
      obj &&
      Array.isArray(obj.points) &&
      typeof obj.backgroundColor === "string"
    ) {
      return obj as GradientConfig;
    }
    return null;
  } catch {
    return null;
  }
}

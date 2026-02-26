import { GradientConfig } from "./types";
import { WebGLGradientRenderer } from "./webgl-renderer";

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export as PNG rendered by the WebGL shader at the given resolution */
export async function exportPng(
  config: GradientConfig,
  width: number,
  height: number,
  filename = "gradient.png"
): Promise<void> {
  const canvas = WebGLGradientRenderer.renderExport(config, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Failed to create PNG blob"));
      const url = URL.createObjectURL(blob);
      triggerDownload(url, filename);
      resolve();
    }, "image/png");
  });
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

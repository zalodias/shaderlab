export interface ColorPoint {
  id: string;
  x: number; // 0–1 normalized, relative to canvas width
  y: number; // 0–1 normalized, relative to canvas height
  color: string; // hex string e.g. "#ff6b6b"
  radius: number; // 0–1, how far the blob spreads relative to the larger canvas dimension
  opacity: number; // 0–1
}

export interface GradientConfig {
  points: ColorPoint[];
  backgroundColor: string;
}

export type AspectRatio = {
  label: string;
  ratio: [number, number]; // [width, height] units
};

export type SizePreset = {
  label: string;
  width: number;
  height: number;
};

export type ExportFormat = "png" | "svg" | "css" | "json";

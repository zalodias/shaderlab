export interface ColorPoint {
  id: string;
  x: number; // 0–1 normalized, relative to canvas width
  y: number; // 0–1 normalized, relative to canvas height
  color: string; // hex string e.g. "#ff6b6b"
  radius: number; // 0–1, how far the blob spreads relative to the larger canvas dimension
  opacity: number; // 0–1
}

export interface ShaderEffects {
  distortion: number  // 0–1, organic noise warping
  swirl: number       // 0–1, vortex distortion
  grainMixer: number  // 0–1, edge grain distortion on color boundaries
  grainOverlay: number // 0–1, full-screen B/W grain overlay
  scale: number       // 0.01–4, zoom level
  rotation: number    // 0–360, degrees
  offsetX: number     // -1 to 1, horizontal pan
  offsetY: number     // -1 to 1, vertical pan
  vibrance: number    // 0.5–2, OKLab chroma multiplier for saturation boost
}

export const DEFAULT_EFFECTS: ShaderEffects = {
  distortion: 0,
  swirl: 0,
  grainMixer: 0,
  grainOverlay: 0,
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  vibrance: 1,
}

export interface GradientConfig {
  points: ColorPoint[]
  backgroundColor: string
  effects: ShaderEffects
}

export type AspectRatio = {
  label: string;
  ratio: [number, number]; // [width, height] units
};

export type ExportFormat = 'png' | 'json'

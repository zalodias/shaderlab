import { DEFAULT_EFFECTS, GradientConfig } from "./types";

export type Preset = {
  id: string;
  name: string;
  config: GradientConfig;
};

export const PRESETS: Preset[] = [
  {
    id: "warm-sunrise",
    name: "Warm Sunrise",
    config: {
      backgroundColor: "#fff5e6",
      effects: DEFAULT_EFFECTS,
      points: [
        { id: "p1", x: 0.15, y: 0.65, color: "#e8553e", radius: 0.65, opacity: 0.9 },
        { id: "p2", x: 0.72, y: 0.2,  color: "#ffe566", radius: 0.6,  opacity: 0.85 },
        { id: "p3", x: 0.55, y: 0.85, color: "#f4a261", radius: 0.55, opacity: 0.7 },
        { id: "p4", x: 0.88, y: 0.55, color: "#ffd966", radius: 0.5,  opacity: 0.6 },
      ],
    },
  },
  {
    id: "arctic-aurora",
    name: "Arctic Aurora",
    config: {
      backgroundColor: "#0d0d1a",
      effects: DEFAULT_EFFECTS,
      points: [
        { id: "p1", x: 0.1,  y: 0.05, color: "#e8e0ff", radius: 0.5,  opacity: 0.7 },
        { id: "p2", x: 0.35, y: 0.55, color: "#5b8dee", radius: 0.65, opacity: 0.9 },
        { id: "p3", x: 0.75, y: 0.3,  color: "#9b87d4", radius: 0.6,  opacity: 0.8 },
        { id: "p4", x: 0.6,  y: 0.85, color: "#3a5fc4", radius: 0.55, opacity: 0.75 },
      ],
    },
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    config: {
      backgroundColor: "#f0f4ff",
      effects: DEFAULT_EFFECTS,
      points: [
        { id: "p1", x: 0.85, y: 0.05, color: "#f4a07a", radius: 0.45, opacity: 0.75 },
        { id: "p2", x: 0.25, y: 0.3,  color: "#e8f0ff", radius: 0.6,  opacity: 0.85 },
        { id: "p3", x: 0.6,  y: 0.6,  color: "#5b8dee", radius: 0.65, opacity: 0.8 },
        { id: "p4", x: 0.15, y: 0.8,  color: "#b8cbff", radius: 0.55, opacity: 0.7 },
      ],
    },
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    config: {
      backgroundColor: "#fffdf0",
      effects: DEFAULT_EFFECTS,
      points: [
        { id: "p1", x: 0.5,  y: 0.15, color: "#c8eaf0", radius: 0.5,  opacity: 0.85 },
        { id: "p2", x: 0.15, y: 0.5,  color: "#fde68a", radius: 0.6,  opacity: 0.8 },
        { id: "p3", x: 0.8,  y: 0.65, color: "#fbbf24", radius: 0.6,  opacity: 0.75 },
        { id: "p4", x: 0.45, y: 0.85, color: "#f59e0b", radius: 0.55, opacity: 0.7 },
      ],
    },
  },
];

export const DEFAULT_CONFIG: GradientConfig = PRESETS[0].config;

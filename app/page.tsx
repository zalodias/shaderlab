"use client";

import { useState, useCallback, useRef } from "react";
import { GradientConfig, ColorPoint } from "@/lib/types";
import { DEFAULT_CONFIG, PRESETS, Preset } from "@/lib/presets";
import { randomPastelHex } from "@/lib/color-utils";
import GradientCanvas, { GradientCanvasHandle } from "@/components/GradientCanvas";
import ControlPanel from "@/components/ControlPanel";

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function randomiseConfig(): GradientConfig {
  const bg = randomPastelHex();
  const count = 3 + Math.floor(Math.random() * 3); // 3-5 points
  const points: ColorPoint[] = Array.from({ length: count }, (_, i) => ({
    id: generateId(),
    x: 0.1 + Math.random() * 0.8,
    y: 0.1 + Math.random() * 0.8,
    color: randomPastelHex(),
    radius: 0.4 + Math.random() * 0.6,
    opacity: 0.6 + Math.random() * 0.35,
  }));
  return { points, backgroundColor: bg };
}

export default function Home() {
  const [config, setConfig] = useState<GradientConfig>(DEFAULT_CONFIG);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(PRESETS[0].id);
  const [aspectRatio, setAspectRatio] = useState<[number, number]>([9, 16]);
  const canvasRef = useRef<GradientCanvasHandle>(null);

  const updatePoint = useCallback(
    (id: string, updates: Partial<ColorPoint>) => {
      setConfig((prev) => ({
        ...prev,
        points: prev.points.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
      setActivePresetId(null);
    },
    []
  );

  const addPoint = useCallback((x = 0.5, y = 0.5) => {
    const newPoint: ColorPoint = {
      id: generateId(),
      x,
      y,
      color: randomPastelHex(),
      radius: 0.5,
      opacity: 0.8,
    };
    setConfig((prev) => ({ ...prev, points: [...prev.points, newPoint] }));
    setSelectedPointId(newPoint.id);
    setActivePresetId(null);
  }, []);

  const removePoint = useCallback(
    (id: string) => {
      setConfig((prev) => ({
        ...prev,
        points: prev.points.filter((p) => p.id !== id),
      }));
      if (selectedPointId === id) setSelectedPointId(null);
      setActivePresetId(null);
    },
    [selectedPointId]
  );

  const updateBackground = useCallback((color: string) => {
    setConfig((prev) => ({ ...prev, backgroundColor: color }));
    setActivePresetId(null);
  }, []);

  const loadPreset = useCallback((preset: Preset) => {
    // Assign fresh IDs to avoid key collisions
    const points = preset.config.points.map((p) => ({ ...p, id: generateId() }));
    setConfig({ ...preset.config, points });
    setSelectedPointId(null);
    setActivePresetId(preset.id);
  }, []);

  const handleRandomise = useCallback(() => {
    setConfig(randomiseConfig());
    setSelectedPointId(null);
    setActivePresetId(null);
  }, []);

  return (
    <main className="relative w-screen h-screen bg-neutral-100 overflow-hidden flex items-center justify-center">
      {/* Full-viewport gradient canvas */}
      <div className="absolute inset-0 p-8">
        <GradientCanvas
          ref={canvasRef}
          config={config}
          aspectRatio={aspectRatio}
          selectedPointId={selectedPointId}
          onSelectPoint={setSelectedPointId}
          onMovePoint={(id, x, y) => updatePoint(id, { x, y })}
          onAddPoint={addPoint}
        />
      </div>

      {/* Floating control panel – bottom-right */}
      <div className="absolute bottom-6 right-6 z-10">
        <ControlPanel
          config={config}
          selectedPointId={selectedPointId}
          activePresetId={activePresetId}
          onSelectPoint={setSelectedPointId}
          onUpdatePoint={updatePoint}
          onAddPoint={() => addPoint()}
          onRemovePoint={removePoint}
          onUpdateBackground={updateBackground}
          onLoadPreset={loadPreset}
          onRandomise={handleRandomise}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
        />
      </div>
    </main>
  );
}

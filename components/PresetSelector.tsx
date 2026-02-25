"use client";

import { useEffect, useRef } from "react";
import { PRESETS, Preset } from "@/lib/presets";
import { WebGLGradientRenderer } from "@/lib/webgl-renderer";

interface PresetSelectorProps {
  onSelect: (preset: Preset) => void;
  activePresetId: string | null;
}

function PresetThumbnail({
  preset,
  isActive,
  onSelect,
}: {
  preset: Preset;
  isActive: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 80;
    canvas.height = 120;
    try {
      const renderer = new WebGLGradientRenderer(canvas);
      renderer.render(preset.config);
      renderer.destroy();
    } catch {
      // WebGL unavailable — leave canvas blank
    }
  }, [preset]);

  return (
    <button
      onClick={onSelect}
      className={`flex flex-col items-center gap-1.5 group transition-all`}
    >
      <div
        className={`rounded-xl overflow-hidden border-2 transition-all ${
          isActive ? "border-neutral-800 shadow-md" : "border-transparent"
        }`}
      >
        <canvas
          ref={canvasRef}
          width={80}
          height={120}
          className="block w-16 h-24 object-cover"
        />
      </div>
      <span
        className={`text-[10px] font-medium text-center leading-tight transition-colors ${
          isActive ? "text-neutral-800" : "text-neutral-400 group-hover:text-neutral-600"
        }`}
      >
        {preset.name}
      </span>
    </button>
  );
}

export default function PresetSelector({
  onSelect,
  activePresetId,
}: PresetSelectorProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
        Presets
      </span>
      <div className="flex gap-3 flex-wrap">
        {PRESETS.map((preset) => (
          <PresetThumbnail
            key={preset.id}
            preset={preset}
            isActive={activePresetId === preset.id}
            onSelect={() => onSelect(preset)}
          />
        ))}
      </div>
    </div>
  );
}

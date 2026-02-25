"use client";

import { Preset } from "@/lib/presets";
import { ColorPoint, GradientConfig } from "@/lib/types";
import { useState } from "react";
import ExportPanel from "./ExportPanel";
import HexInput from "./HexInput";
import PointEditor from "./PointEditor";
import PresetSelector from "./PresetSelector";

interface ControlPanelProps {
  config: GradientConfig;
  selectedPointId: string | null;
  activePresetId: string | null;
  onSelectPoint: (id: string | null) => void;
  onUpdatePoint: (id: string, updates: Partial<ColorPoint>) => void;
  onAddPoint: () => void;
  onRemovePoint: (id: string) => void;
  onUpdateBackground: (color: string) => void;
  onLoadPreset: (preset: Preset) => void;
  onRandomise: () => void;
  aspectRatio: [number, number];
  onAspectRatioChange: (ratio: [number, number]) => void;
}

type Tab = "points" | "presets" | "export";

const ASPECT_RATIOS: { label: string; ratio: [number, number] }[] = [
  { label: "1:1", ratio: [1, 1] },
  { label: "4:3", ratio: [4, 3] },
  { label: "3:4", ratio: [3, 4] },
  { label: "16:9", ratio: [16, 9] },
  { label: "9:16", ratio: [9, 16] },
  { label: "3:2", ratio: [3, 2] },
  { label: "2:3", ratio: [2, 3] },
];

export default function ControlPanel({
  config,
  selectedPointId,
  activePresetId,
  onSelectPoint,
  onUpdatePoint,
  onAddPoint,
  onRemovePoint,
  onUpdateBackground,
  onLoadPreset,
  onRandomise,
  aspectRatio,
  onAspectRatioChange,
}: ControlPanelProps) {
  const [tab, setTab] = useState<Tab>("points");

  return (
    <div className="w-72 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-neutral-200/60 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-sm font-semibold text-neutral-800 tracking-tight">
            Mesh Gradient (Canvas)
          </h1>
          <button
            onClick={onRandomise}
            className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg px-2.5 py-1 transition-all"
          >
            Randomise
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 bg-neutral-100 rounded-xl p-0.5">
          {(["points", "presets", "export"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-[10px] text-xs font-medium capitalize transition-all ${
                tab === t
                  ? "bg-white text-neutral-800 shadow-sm"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4">
        {tab === "points" && (
          <div className="flex flex-col gap-3">
            {/* Background colour */}
            <HexInput
              label="Background"
              value={config.backgroundColor}
              onChange={onUpdateBackground}
            />

            {/* Aspect ratio */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Ratio
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ASPECT_RATIOS.map(({ label, ratio }) => {
                  const active =
                    aspectRatio[0] === ratio[0] && aspectRatio[1] === ratio[1];
                  return (
                    <button
                      key={label}
                      onClick={() => onAspectRatioChange(ratio)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        active
                          ? "bg-neutral-800 text-white"
                          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-100" />

            {/* Points list */}
            <div className="flex flex-col gap-1.5">
              {config.points.map((point, index) => (
                <PointEditor
                  key={point.id}
                  point={point}
                  index={index}
                  isSelected={selectedPointId === point.id}
                  onSelect={() =>
                    onSelectPoint(
                      selectedPointId === point.id ? null : point.id,
                    )
                  }
                  onUpdate={(updates) => onUpdatePoint(point.id, updates)}
                  onRemove={() => onRemovePoint(point.id)}
                />
              ))}
            </div>

            {/* Add point */}
            {config.points.length < 8 && (
              <button
                onClick={onAddPoint}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-dashed border-neutral-300 text-xs font-medium text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all"
              >
                <span className="text-base leading-none">+</span>
                Add point
              </button>
            )}
          </div>
        )}

        {tab === "presets" && (
          <PresetSelector
            onSelect={onLoadPreset}
            activePresetId={activePresetId}
          />
        )}

        {tab === "export" && <ExportPanel config={config} />}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2.5 border-t border-neutral-100">
        <p className="text-[10px] text-neutral-400 text-center">
          Drag handles to reposition · Double-click canvas to add
        </p>
      </div>
    </div>
  );
}

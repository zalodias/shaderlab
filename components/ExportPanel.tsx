"use client";

import { useState } from "react";
import { GradientConfig, SizePreset } from "@/lib/types";
import { exportPng, exportSvg, exportCss, exportJson } from "@/lib/export";

const SIZE_PRESETS: SizePreset[] = [
  { label: "1:1", width: 1080, height: 1080 },
  { label: "4:3", width: 1600, height: 1200 },
  { label: "3:4", width: 1200, height: 1600 },
  { label: "16:9", width: 1920, height: 1080 },
  { label: "9:16", width: 1080, height: 1920 },
  { label: "3:2", width: 1500, height: 1000 },
  { label: "2:3", width: 1000, height: 1500 },
];

interface ExportPanelProps {
  config: GradientConfig;
}

export default function ExportPanel({ config }: ExportPanelProps) {
  const [selectedPreset, setSelectedPreset] = useState<SizePreset>(SIZE_PRESETS[3]);
  const [customWidth, setCustomWidth] = useState("1920");
  const [customHeight, setCustomHeight] = useState("1080");
  const [useCustom, setUseCustom] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const exportWidth = useCustom ? parseInt(customWidth) || 1920 : selectedPreset.width;
  const exportHeight = useCustom ? parseInt(customHeight) || 1080 : selectedPreset.height;

  async function handleExport(format: string) {
    setExporting(format);
    try {
      if (format === "png") await exportPng(config, exportWidth, exportHeight);
      else if (format === "svg") exportSvg(config, exportWidth, exportHeight);
      else if (format === "css") exportCss(config);
      else if (format === "json") exportJson(config);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
        Export
      </span>

      {/* Size selector */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {SIZE_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => { setSelectedPreset(p); setUseCustom(false); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                !useCustom && selectedPreset.label === p.label
                  ? "bg-neutral-800 text-white"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setUseCustom(true)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              useCustom
                ? "bg-neutral-800 text-white"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
            }`}
          >
            Custom
          </button>
        </div>

        {useCustom && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={customWidth}
              onChange={(e) => setCustomWidth(e.target.value)}
              className="w-20 px-2 py-1.5 rounded-lg border border-neutral-200 text-xs font-mono text-neutral-700 bg-neutral-50 outline-none focus:border-neutral-400"
              placeholder="W"
              min={1}
            />
            <span className="text-neutral-400 text-xs">×</span>
            <input
              type="number"
              value={customHeight}
              onChange={(e) => setCustomHeight(e.target.value)}
              className="w-20 px-2 py-1.5 rounded-lg border border-neutral-200 text-xs font-mono text-neutral-700 bg-neutral-50 outline-none focus:border-neutral-400"
              placeholder="H"
              min={1}
            />
            <span className="text-neutral-400 text-xs">px</span>
          </div>
        )}

        {!useCustom && (
          <p className="text-[11px] text-neutral-400 font-mono">
            {exportWidth} × {exportHeight} px
          </p>
        )}
      </div>

      {/* Format buttons */}
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { id: "png", label: "PNG" },
          { id: "svg", label: "SVG" },
          { id: "css", label: "CSS" },
          { id: "json", label: "JSON" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleExport(id)}
            disabled={!!exporting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-xs font-semibold text-neutral-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {exporting === id ? (
              <span className="animate-pulse">…</span>
            ) : (
              <>
                <span className="text-neutral-400">↓</span>
                {label}
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

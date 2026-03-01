'use client'

import { ExportPanel } from '@/components/export-panel'
import { HexInput } from '@/components/hex-input'
import { PointEditor } from '@/components/point-editor'
import { PresetSelector } from '@/components/preset-selector'
import { Slider } from '@/components/slider'
import { Preset } from '@/lib/presets'
import { ColorPoint, GradientConfig, ShaderEffects } from '@/lib/types'
import { useState } from 'react'

interface ControlPanelProps {
  config: GradientConfig
  selectedPointId: string | null
  activePresetId: string | null
  aspectRatio: [number, number]
  onSelectPoint: (id: string | null) => void
  onUpdatePoint: (id: string, updates: Partial<ColorPoint>) => void
  onAddPoint: () => void
  onRemovePoint: (id: string) => void
  onUpdateBackground: (color: string) => void
  onUpdateEffects: (updates: Partial<ShaderEffects>) => void
  onLoadPreset: (preset: Preset) => void
  onRandomise: () => void
  onAspectRatioChange: (ratio: [number, number]) => void
}

type Tab = 'controls' | 'presets' | 'export'

const ASPECT_RATIOS: { label: string; ratio: [number, number] }[] = [
  { label: '1:1', ratio: [1, 1] },
  { label: '4:3', ratio: [4, 3] },
  { label: '3:4', ratio: [3, 4] },
  { label: '16:9', ratio: [16, 9] },
  { label: '9:16', ratio: [9, 16] },
  { label: '3:2', ratio: [3, 2] },
  { label: '2:3', ratio: [2, 3] },
]

export function ControlPanel({
  config,
  selectedPointId,
  activePresetId,
  aspectRatio,
  onSelectPoint,
  onUpdatePoint,
  onAddPoint,
  onRemovePoint,
  onUpdateBackground,
  onUpdateEffects,
  onLoadPreset,
  onRandomise,
  onAspectRatioChange,
}: ControlPanelProps) {
  const [tab, setTab] = useState<Tab>('controls')

  const { effects } = config

  function handleTabClick(e: React.MouseEvent<HTMLButtonElement>) {
    const next = (e.currentTarget as HTMLButtonElement).dataset.tab as Tab
    if (next) setTab(next)
  }

  function handleTogglePoint(point: { id: string }) {
    onSelectPoint(selectedPointId === point.id ? null : point.id)
  }

  return (
    <div className="w-72 bg-white/90 backdrop-blur-xl rounded-2xl border border-neutral-200/60 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-neutral-100 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-sm font-semibold text-neutral-800 tracking-tight">
            Shader Lab
          </h1>
          <button
            onClick={onRandomise}
            className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg px-2.5 py-1 transition-all"
          >
            Randomise
          </button>
        </div>

        <div className="flex gap-0.5 bg-neutral-100 rounded-xl p-0.5">
          {(['controls', 'presets', 'export'] as Tab[]).map((t) => (
            <button
              key={t}
              data-tab={t}
              onClick={handleTabClick}
              className={`flex-1 py-1.5 rounded-[10px] text-xs font-medium capitalize transition-all ${
                tab === t
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 min-h-0">
        {tab === 'controls' && (
          <div className="flex flex-col gap-5">
            {/* Background */}
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
                  const isActive =
                    aspectRatio[0] === ratio[0] && aspectRatio[1] === ratio[1]
                  return (
                    <button
                      key={label}
                      onClick={() => onAspectRatioChange(ratio)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-neutral-800 text-white'
                          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="h-px bg-neutral-100" />

            {/* Effects */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Effects
              </span>

              <Slider
                label="Vibrance"
                value={effects.vibrance}
                min={0.5}
                max={2}
                step={0.05}
                displayValue={effects.vibrance.toFixed(2)}
                onChange={(v) => onUpdateEffects({ vibrance: v })}
              />
              <Slider
                label="Distortion"
                value={effects.distortion}
                onChange={(v) => onUpdateEffects({ distortion: v })}
              />
              <Slider
                label="Swirl"
                value={effects.swirl}
                onChange={(v) => onUpdateEffects({ swirl: v })}
              />
              <Slider
                label="Grain Mixer"
                value={effects.grainMixer}
                onChange={(v) => onUpdateEffects({ grainMixer: v })}
              />
              <Slider
                label="Grain Overlay"
                value={effects.grainOverlay}
                onChange={(v) => onUpdateEffects({ grainOverlay: v })}
              />
              <Slider
                label="Scale"
                value={effects.scale}
                min={0.01}
                max={4}
                step={0.01}
                displayValue={effects.scale.toFixed(2) + '×'}
                onChange={(v) => onUpdateEffects({ scale: v })}
              />
              <Slider
                label="Rotation"
                value={effects.rotation}
                min={0}
                max={360}
                step={1}
                displayValue={Math.round(effects.rotation) + '°'}
                onChange={(v) => onUpdateEffects({ rotation: v })}
              />
              <Slider
                label="Offset X"
                value={effects.offsetX}
                min={-1}
                max={1}
                step={0.01}
                displayValue={(effects.offsetX >= 0 ? '+' : '') + effects.offsetX.toFixed(2)}
                onChange={(v) => onUpdateEffects({ offsetX: v })}
              />
              <Slider
                label="Offset Y"
                value={effects.offsetY}
                min={-1}
                max={1}
                step={0.01}
                displayValue={(effects.offsetY >= 0 ? '+' : '') + effects.offsetY.toFixed(2)}
                onChange={(v) => onUpdateEffects({ offsetY: v })}
              />
            </div>

            <div className="h-px bg-neutral-100" />

            {/* Points */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Points
              </span>

              <div className="flex flex-col gap-1.5">
                {config.points.map((point, index) => (
                  <PointEditor
                    key={point.id}
                    point={point}
                    index={index}
                    isSelected={selectedPointId === point.id}
                    onSelect={() => handleTogglePoint(point)}
                    onUpdate={(updates) => onUpdatePoint(point.id, updates)}
                    onRemove={() => onRemovePoint(point.id)}
                  />
                ))}
              </div>

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
          </div>
        )}

        {tab === 'presets' && (
          <PresetSelector
            onSelect={onLoadPreset}
            activePresetId={activePresetId}
          />
        )}

        {tab === 'export' && (
          <ExportPanel config={config} aspectRatio={aspectRatio} />
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2.5 border-t border-neutral-100 shrink-0">
        <p className="text-[10px] text-neutral-400 text-center">
          Drag handles to reposition · Double-click canvas to add
        </p>
      </div>
    </div>
  )
}

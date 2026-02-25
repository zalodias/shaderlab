'use client'

import { HexInput } from '@/components/hex-input'
import { Slider } from '@/components/slider'
import { ColorPoint } from '@/lib/types'

interface PointEditorProps {
  point: ColorPoint
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<ColorPoint>) => void
  onRemove: () => void
  index: number
}

export function PointEditor({
  point,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  index,
}: PointEditorProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') onSelect()
  }

  function handleRemoveClick(e: React.MouseEvent) {
    e.stopPropagation()
    onRemove()
  }

  return (
    <div
      className={`rounded-xl border transition-all ${
        isSelected
          ? 'border-neutral-300 bg-white shadow-sm'
          : 'border-transparent bg-neutral-50 hover:bg-neutral-100'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isSelected}
        className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none"
        onClick={onSelect}
        onKeyDown={handleKeyDown}
      >
        <div
          className="w-5 h-5 rounded-full shrink-0 shadow-sm border border-black/10"
          style={{ backgroundColor: point.color }}
        />
        <span className="text-sm font-medium text-neutral-700 flex-1">
          Point {index + 1}
        </span>
        <button
          type="button"
          onClick={handleRemoveClick}
          className="w-5 h-5 flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors text-xs"
          aria-label="Remove point"
        >
          ✕
        </button>
      </div>

      {isSelected && (
        <div className="px-3 pb-3 flex flex-col gap-3 border-t border-neutral-100 pt-3">
          <HexInput
            label="Colour"
            value={point.color}
            onChange={(color) => onUpdate({ color })}
          />
          <Slider
            label="Radius"
            value={point.radius}
            min={0.1}
            max={1.5}
            step={0.01}
            onChange={(radius) => onUpdate({ radius })}
          />
          <Slider
            label="Opacity"
            value={point.opacity}
            onChange={(opacity) => onUpdate({ opacity })}
          />
        </div>
      )}
    </div>
  )
}

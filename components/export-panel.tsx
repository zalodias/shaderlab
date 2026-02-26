'use client'

import { exportJson, exportPng } from '@/lib/export'
import { GradientConfig } from '@/lib/types'
import { useState } from 'react'

interface ExportPanelProps {
  config: GradientConfig
  aspectRatio: [number, number]
}

const BASE_SIZE = 1080

export function ExportPanel({ config, aspectRatio }: ExportPanelProps) {
  const [multiplier, setMultiplier] = useState('1')
  const [exporting, setExporting] = useState<string | null>(null)

  const [aw, ah] = aspectRatio
  const baseW = aw >= ah ? BASE_SIZE : Math.round(BASE_SIZE * (aw / ah))
  const baseH = ah >= aw ? BASE_SIZE : Math.round(BASE_SIZE * (ah / aw))
  const mult = Math.max(0.25, parseFloat(multiplier) || 1)
  const exportW = Math.round(baseW * mult)
  const exportH = Math.round(baseH * mult)

  async function handleExportPng() {
    setExporting('png')
    try {
      await exportPng(config, exportW, exportH)
    } finally {
      setExporting(null)
    }
  }

  function handleExportJson() {
    exportJson(config)
  }

  function handleMultiplierChange(e: React.ChangeEvent<HTMLInputElement>) {
    setMultiplier(e.target.value)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Resolution
        </span>

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={multiplier}
            onChange={handleMultiplierChange}
            className="w-16 px-2 py-1.5 rounded-lg border border-neutral-200 text-xs font-mono text-neutral-700 bg-neutral-50 outline-none focus:border-neutral-400"
            placeholder="1"
            min={0.25}
            step={0.5}
          />
          <span className="text-xs text-neutral-400">×</span>
          <span className="text-xs text-neutral-500 font-mono">
            = {exportW} × {exportH} px
          </span>
        </div>

        <p className="text-[11px] text-neutral-400">
          Base {baseW} × {baseH} px · multiply for larger output
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <button
          onClick={handleExportPng}
          disabled={!!exporting}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-xs font-semibold text-neutral-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {exporting === 'png' ? (
            <span className="animate-pulse">Exporting…</span>
          ) : (
            <>
              <span className="text-neutral-400">↓</span>
              Export PNG
            </>
          )}
        </button>

        <button
          onClick={handleExportJson}
          disabled={!!exporting}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-xs font-semibold text-neutral-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <span className="text-neutral-400">↓</span>
          Export JSON
        </button>
      </div>
    </div>
  )
}

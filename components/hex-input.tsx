'use client'

import { isValidHex, normaliseHex } from '@/lib/color-utils'
import { useEffect, useState } from 'react'

interface HexInputProps {
  value: string
  onChange: (hex: string) => void
  label?: string
}

export function HexInput({ value, onChange, label }: HexInputProps) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  function commit(raw: string) {
    const normalised = normaliseHex(raw.replace(/[^0-9a-fA-F#]/g, ''))
    if (isValidHex(normalised)) {
      onChange(normalised)
      setDraft(normalised)
    } else {
      setDraft(value)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDraft(e.target.value)
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    commit(e.target.value)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
  }

  function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value)
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2 bg-neutral-100 rounded-lg px-2.5 py-2 border border-neutral-200 focus-within:border-neutral-400 transition-colors">
        <div
          className="w-4 h-4 rounded-full shrink-0 shadow-sm border border-black/10"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={draft}
          maxLength={7}
          spellCheck={false}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-xs font-mono text-neutral-700 outline-none min-w-0"
        />
        <input
          type="color"
          value={value}
          onChange={handleColorChange}
          className="w-4 h-4 rounded cursor-pointer opacity-0 absolute"
          style={{ pointerEvents: 'none' }}
          tabIndex={-1}
        />
      </div>
    </div>
  )
}

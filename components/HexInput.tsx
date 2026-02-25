"use client";

import { useState, useEffect } from "react";
import { isValidHex, normaliseHex } from "@/lib/color-utils";

interface HexInputProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
}

export default function HexInput({ value, onChange, label }: HexInputProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit(raw: string) {
    const normalised = normaliseHex(raw.replace(/[^0-9a-fA-F#]/g, ""));
    if (isValidHex(normalised)) {
      onChange(normalised);
      setDraft(normalised);
    } else {
      setDraft(value);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2 bg-neutral-100 rounded-lg px-2.5 py-2 border border-neutral-200 focus-within:border-neutral-400 transition-colors">
        {/* Colour swatch */}
        <div
          className="w-4 h-4 rounded-full shrink-0 shadow-sm border border-black/10"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={draft}
          maxLength={7}
          spellCheck={false}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
          }}
          className="flex-1 bg-transparent text-xs font-mono text-neutral-700 outline-none min-w-0"
        />
        {/* Native colour picker as secondary helper */}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-4 h-4 rounded cursor-pointer opacity-0 absolute"
          style={{ pointerEvents: "none" }}
          tabIndex={-1}
        />
      </div>
    </div>
  );
}

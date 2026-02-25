"use client";

interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  displayValue?: string;
}

export default function Slider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  displayValue,
}: SliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-xs font-mono text-neutral-400">
          {displayValue ?? Math.round(value * 100) + "%"}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-neutral-200 accent-neutral-800 cursor-pointer"
      />
    </div>
  );
}

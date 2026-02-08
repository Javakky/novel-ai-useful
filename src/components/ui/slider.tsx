"use client";

import { cn } from "@/lib/utils";

interface SliderProps {
  label?: string;
  id?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
  showValue?: boolean;
}

export function Slider({
  label,
  id,
  value,
  min,
  max,
  step,
  onChange,
  className,
  disabled,
  showValue = true,
}: SliderProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={id} className="text-sm text-nai-muted">
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-sm text-nai-text">{value}</span>
          )}
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-nai-primary accent-nai-accent"
      />
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ className, label, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm text-nai-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "h-10 w-full rounded-md border border-nai-primary bg-nai-surface px-3 text-sm text-nai-text",
          "placeholder:text-nai-muted",
          "focus:border-nai-accent focus:outline-none focus:ring-1 focus:ring-nai-accent",
          "disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  );
}

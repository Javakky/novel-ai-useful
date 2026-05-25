"use client";

import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ className, label, id, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm text-nai-muted">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          "min-h-[80px] w-full rounded-md border border-nai-primary bg-nai-surface px-3 py-2 text-sm text-nai-text",
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

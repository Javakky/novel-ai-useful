"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function Card({ className, title, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-nai-primary bg-nai-surface p-4",
        className
      )}
      {...props}
    >
      {title && (
        <h3 className="mb-3 text-sm font-semibold text-nai-text">{title}</h3>
      )}
      {children}
    </div>
  );
}

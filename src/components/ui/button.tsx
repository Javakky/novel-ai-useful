"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nai-accent",
        "disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-nai-accent text-white hover:bg-nai-accent/80":
            variant === "primary",
          "bg-nai-primary text-nai-text hover:bg-nai-primary/80":
            variant === "secondary",
          "bg-red-600 text-white hover:bg-red-700": variant === "danger",
          "bg-transparent text-nai-text hover:bg-nai-surface":
            variant === "ghost",
        },
        {
          "h-8 px-3 text-sm": size === "sm",
          "h-10 px-4 text-sm": size === "md",
          "h-12 px-6 text-base": size === "lg",
        },
        className
      )}
      disabled={disabled}
      {...props}
    />
  );
}

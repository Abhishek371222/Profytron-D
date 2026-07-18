'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
 return (
 <input
 type={type}
 className={cn(
  "flex h-[var(--control-h)] w-full rounded-input px-[var(--control-px)] py-2 text-body-sm text-foreground",
  "border border-input-border bg-input",
  "placeholder:text-placeholder",
  "file:border-0 file:bg-transparent file:text-body-sm file:font-medium",
  "transition-[border-color,box-shadow,background] duration-[var(--motion-standard,200ms)] ease-[var(--ease-out)]",
  "focus-visible:outline-none",
  "focus-visible:border-[var(--primary)]",
  "focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_14%,transparent)]",
  "aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_3px_color-mix(in_srgb,var(--destructive)_18%,transparent)]",
  "hover:border-[color-mix(in_srgb,var(--primary)_25%,var(--border))]",
  "disabled:cursor-not-allowed disabled:opacity-50",
  className
 )}
 {...props}
 />
 )
}

export { Input }

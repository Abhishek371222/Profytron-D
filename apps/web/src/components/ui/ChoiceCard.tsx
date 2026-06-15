"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ChoiceCardProps = {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
};

/** Premium selectable option — used in onboarding, settings, filters */
export function ChoiceCard({
  label,
  selected = false,
  onClick,
  disabled = false,
  className,
  icon,
}: ChoiceCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        "choice-card group relative w-full text-left",
        selected && "choice-card-selected",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <span className="relative z-10 flex items-center gap-3">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
        )}
        <span
          className={cn(
            "flex-1 text-sm font-medium leading-snug",
            selected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
          )}
        >
          {label}
        </span>
        {selected && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        )}
      </span>
      {selected && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-primary/5 via-transparent to-primary/10"
        />
      )}
    </motion.button>
  );
}

"use client";

import React from "react";
import { cn } from "@/lib/utils";

type DashboardCardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
};

const PADDING = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

/** Premium dashboard surface — matches hero preview cards */
export function DashboardCard({
  children,
  className,
  hover = true,
  padding = "md",
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "dashboard-card relative overflow-hidden surface-glow",
        PADDING[padding],
        hover && [
          "transition-[transform,box-shadow,border-color] duration-[250ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
          "will-change-transform",
          "hover:-translate-y-1",
          "hover:shadow-[var(--shadow-card-hover)]",
          "hover:border-[color-mix(in_srgb,var(--primary)_16%,var(--card-border))]",
        ],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DashboardCardHeader({
  title,
  subtitle,
  action,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--card-border)] pb-4 mb-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex-shrink-0 w-8 h-8 rounded-[10px] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] border border-[color-mix(in_srgb,var(--primary)_15%,transparent)] flex items-center justify-center mt-0.5">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
        <div>
          <h2 className="text-base font-bold text-foreground leading-snug">{title}</h2>
          {subtitle && <p className="text-caption text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

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
        "dashboard-card relative overflow-hidden",
        PADDING[padding],
        hover && "card-lift transition-shadow duration-300 hover:shadow-card-premium",
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
      <div>
        {Icon && (
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
          </div>
        )}
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-caption text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

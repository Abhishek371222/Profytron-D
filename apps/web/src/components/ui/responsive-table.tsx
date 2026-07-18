import React from "react";
import { cn } from "@/lib/utils";

export function ResponsiveTableShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("responsive-table-shell", className)}>
      <div className="responsive-table-inner">{children}</div>
    </div>
  );
}

export function ResponsiveCardGrid({
  children,
  className,
  minCol = "17.5rem",
}: {
  children: React.ReactNode;
  className?: string;
  minCol?: string;
}) {
  return (
    <div
      className={cn("responsive-card-grid", className)}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minCol}), 1fr))` }}
    >
      {children}
    </div>
  );
}

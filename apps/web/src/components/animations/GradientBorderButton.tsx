"use client";

import React from "react";
import { cn } from "@/lib/utils";

type GradientBorderButtonProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
};

/** CTA with subtle animated gradient border (8s loop) */
export function GradientBorderButton({
  children,
  className,
  href,
  onClick,
}: GradientBorderButtonProps) {
  const innerClass = cn(
    "relative w-full inline-flex items-center justify-center gap-2 h-12 px-8 rounded-[13px]",
    "bg-gradient-cta text-primary-foreground font-semibold text-body no-underline",
    "shadow-cta shadow-cta-hover transition-all duration-200",
    "hover:scale-[1.03] active:scale-[0.98]",
    className,
  );

  return (
    <div className="relative rounded-[14px] p-[1.5px] overflow-hidden group inline-block">
      <div
        className="absolute inset-[-100%] animate-gradient-border opacity-60 group-hover:opacity-90 transition-opacity"
        style={{
          background: "conic-gradient(from 0deg, #47a7aa, #1e6d48, #34d399, #47a7aa)",
        }}
      />
      {href ? (
        <a href={href} onClick={onClick} className={innerClass}>
          {children}
        </a>
      ) : (
        <button type="button" onClick={onClick} className={innerClass}>
          {children}
        </button>
      )}
    </div>
  );
}

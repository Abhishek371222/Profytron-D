"use client";

import React from "react";
import { cn } from "@/lib/utils";
import RotatingEarth from "@/components/ui/wireframe-dotted-globe";

export interface MarketplaceHeroVisualProps {
  className?: string;
}

export function MarketplaceHeroVisual({ className }: MarketplaceHeroVisualProps) {
  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <div className="marketplace-chart-glow pointer-events-none absolute -inset-x-6 -inset-y-10 sm:-inset-x-12 sm:-inset-y-16" />
      <div className="relative mx-auto flex aspect-square w-full max-w-[min(22rem,100%)] items-center justify-center sm:max-w-[min(26rem,100%)] lg:max-w-[min(30rem,100%)] xl:max-w-[min(34rem,100%)]">
        <RotatingEarth className="h-full w-full max-w-full" />
      </div>
    </div>
  );
}

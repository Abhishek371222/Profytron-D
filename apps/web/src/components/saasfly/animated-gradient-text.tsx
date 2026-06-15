import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AnimatedGradientText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative inline-flex max-w-fit items-center justify-center rounded-full bg-muted/60 px-4 py-1.5 text-caption font-semibold shadow-[inset_0_-8px_10px_color-mix(in_srgb,var(--primary)_8%,transparent)] backdrop-blur-sm transition-shadow duration-500 [--bg-size:300%] hover:shadow-[inset_0_-5px_10px_color-mix(in_srgb,var(--primary)_18%,transparent)] border border-border",
        className,
      )}
    >
      <div
        className="animate-gradient absolute inset-0 block h-full w-full bg-gradient-to-r from-primary/50 via-chart-2/50 to-chart-3/50 bg-[length:var(--bg-size)_100%] p-px [border-radius:inherit] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] ![mask-composite:subtract]"
      />
      {children}
    </div>
  );
}

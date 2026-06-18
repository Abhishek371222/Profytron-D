import React from "react";
import { cn } from "@/lib/utils";

/** Deterministic 0–1 value — same on server and client (avoids hydration mismatch). */
function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function meteorStyle(index: number): React.CSSProperties {
  return {
    top: 0,
    left: `${Math.floor(seededUnit(index) * 100)}%`,
    animationDelay: `${(seededUnit(index + 100) * 2 + 0.2).toFixed(3)}s`,
    animationDuration: `${Math.floor(seededUnit(index + 200) * 8 + 3)}s`,
  };
}

export const Meteors = ({
  number = 20,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  return (
    <>
      {Array.from({ length: number }, (_, idx) => (
        <span
          key={`meteor-${idx}`}
          className={cn(
            "animate-meteor-effect pointer-events-none absolute left-1/2 top-1/2 h-0.5 w-0.5 rotate-[215deg] rounded-[9999px] bg-primary/60 shadow-[0_0_0_1px_rgba(71,167,170,0.1)]",
            "before:absolute before:top-1/2 before:h-[1px] before:w-[50px] before:-translate-y-[50%] before:transform before:bg-gradient-to-r before:from-primary/80 before:to-transparent before:content-['']",
            className,
          )}
          style={meteorStyle(idx)}
        />
      ))}
    </>
  );
};

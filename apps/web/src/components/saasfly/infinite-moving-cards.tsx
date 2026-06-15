"use client";

import { useEffect, useRef, useState } from "react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "normal",
  pauseOnHover = true,
  className,
}: {
  items: { quote: string; name: string; title: string }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !scrollerRef.current) return;
    const scrollerContent = Array.from(scrollerRef.current.children);
    scrollerContent.forEach((item) => {
      const dup = item.cloneNode(true);
      if (scrollerRef.current) scrollerRef.current.appendChild(dup);
    });
    containerRef.current.style.setProperty(
      "--animation-direction",
      direction === "left" ? "forwards" : "reverse",
    );
    const durations = { fast: "20s", normal: "45s", slow: "80s" };
    containerRef.current.style.setProperty("--animation-duration", durations[speed]);
    setStart(true);
  }, [direction, speed]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]",
        className,
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
      >
        {items.map((item, idx) => (
          <li
            key={`${item.name}-${idx}`}
            className="relative w-[350px] max-w-full flex-shrink-0 rounded-[22px] border border-white/[0.08] bg-muted/2 px-8 py-6 md:w-[450px] transition-all duration-300 hover:bg-muted/5 hover:border-primary/25"
            style={{
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <blockquote>
              <span className="relative z-20 text-sm font-normal leading-[1.6] text-foreground/70">
                {item.quote}
              </span>
              <div className="relative z-20 mt-6 flex flex-row items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{item.name[0]}</span>
                </div>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">{item.name}</span>
                  <span className="text-xs text-foreground/40">{item.title}</span>
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
};

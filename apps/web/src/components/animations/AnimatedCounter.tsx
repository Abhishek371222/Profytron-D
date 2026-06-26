"use client";

import React from "react";
import { useInView } from "framer-motion";

type AnimatedCounterProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
};

function formatCounterValue(
  value: number,
  prefix: string,
  suffix: string,
  decimals: number,
): string {
  const formatted =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString();
  return `${prefix}${formatted}${suffix}`;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  duration = 1.8,
}: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const finalLabel = formatCounterValue(value, prefix, suffix, decimals);
  const [display, setDisplay] = React.useState(finalLabel);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  React.useEffect(() => {
    if (!inView || prefersReducedMotion) {
      setDisplay(finalLabel);
      return;
    }

    const start = performance.now();
    const ms = duration * 1000;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = value * eased;
      setDisplay(formatCounterValue(current, prefix, suffix, decimals));
      if (p < 1) requestAnimationFrame(tick);
    };

    setDisplay(formatCounterValue(0, prefix, suffix, decimals));
    requestAnimationFrame(tick);
  }, [inView, prefersReducedMotion, value, prefix, suffix, decimals, duration, finalLabel]);

  return (
    <span ref={ref} className={className}>
      {inView ? display : finalLabel}
    </span>
  );
}

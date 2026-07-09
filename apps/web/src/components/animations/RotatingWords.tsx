"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type RotatingWordsProps = {
  words: string[];
  interval?: number;
  className?: string;
  /** Render on its own line (recommended for hero headlines). */
  block?: boolean;
};

export function RotatingWords({
  words,
  interval = 2800,
  className,
  block = false,
}: RotatingWordsProps) {
  const [index, setIndex] = useState(0);

  const longest = useMemo(
    () => words.reduce((a, b) => (a.length >= b.length ? a : b), words[0] ?? ""),
    [words],
  );

  useEffect(() => {
    if (words.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <span
      className={cn(
        "relative align-bottom overflow-hidden",
        block ? "block" : "inline-block",
        className,
      )}
      style={{ minWidth: block ? undefined : `${Math.max(longest.length, 8)}ch` }}
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block brand-gradient-text"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

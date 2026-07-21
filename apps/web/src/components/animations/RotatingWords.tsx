"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type RotatingWordsProps = {
  words: string[];
  interval?: number;
  className?: string;
  block?: boolean;
};

export function RotatingWords({
  words,
  interval = 2800,
  className,
  block = false,
}: RotatingWordsProps) {
  const [index, setIndex] = useState(0);
  const [hasRotated, setHasRotated] = useState(false);
  const reduceMotion = useReducedMotion();

  const longest = useMemo(
    () => words.reduce((a, b) => (a.length >= b.length ? a : b), words[0] ?? ""),
    [words],
  );

  useEffect(() => {
    if (reduceMotion || words.length <= 1) return;
    const id = setInterval(() => {
      setHasRotated(true);
      setIndex((i) => (i + 1) % words.length);
    }, interval);
    return () => clearInterval(id);
  }, [words.length, interval, reduceMotion]);

  const word = words[index] ?? "";

  return (
    <span
      className={cn(
        "relative align-bottom overflow-hidden",
        block ? "block" : "inline-block",
        className,
      )}
      style={{ minWidth: block ? undefined : `${Math.max(longest.length, 8)}ch` }}
      aria-hidden
    >
      {/* First paint: static word (no opacity:0 / blur) so hero H1 can be LCP. */}
      {!hasRotated || reduceMotion ? (
        <span className="inline-block brand-gradient-text">{word}</span>
      ) : (
        <AnimatePresence mode="wait">
          <motion.span
            key={word}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block brand-gradient-text"
          >
            {word}
          </motion.span>
        </AnimatePresence>
      )}
    </span>
  );
}

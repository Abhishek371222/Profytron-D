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
  interval = 2600,
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
        "relative overflow-hidden align-bottom",
        block ? "block" : "inline-block",
        className,
      )}
      style={{ minWidth: block ? undefined : `${Math.max(longest.length, 8)}ch` }}
      aria-hidden
    >
      {!hasRotated || reduceMotion ? (
        <span className="inline-block brand-gradient-text">{word}</span>
      ) : (
        <AnimatePresence mode="wait">
          <motion.span
            key={word}
            initial={{ opacity: 0, y: "55%", rotateX: -40, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: "0%", rotateX: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: "-45%", rotateX: 28, filter: "blur(3px)" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block origin-bottom brand-gradient-text"
            style={{ transformStyle: "preserve-3d" }}
          >
            {word}
          </motion.span>
        </AnimatePresence>
      )}
    </span>
  );
}

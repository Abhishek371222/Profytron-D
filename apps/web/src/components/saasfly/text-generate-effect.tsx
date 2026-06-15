"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

function TextGenerateEffectImpl({
  words,
  className,
  wordClassName,
}: {
  words: string;
  className?: string;
  wordClassName?: string;
}) {
  const [scope, animate] = useAnimate();
  const wordsArray = words.split(" ");

  useEffect(() => {
    void animate(
      "span",
      { opacity: 1 },
      { duration: 2, delay: stagger(0.1) },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.current, words]);

  return (
    <div className={cn("", className)}>
      <motion.div ref={scope} className="inline">
        {wordsArray.map((word, idx) => (
          <motion.span
            key={`${word}-${idx}`}
            className={cn("opacity-0", wordClassName)}
          >
            {word}{" "}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

export const TextGenerateEffect = dynamic(
  () => Promise.resolve(TextGenerateEffectImpl),
  { ssr: false },
);

"use client";

import * as React from "react";
import { motion } from "framer-motion";

const COLORS = [
  "var(--primary)",
  "var(--chart-2)",
  "var(--p-light)",
  "var(--chart-3)",
  "var(--chart-5)",
  "var(--primary)",
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--p-light)",
  "var(--chart-3)",
];

export function ColourfulText({ text, className }: { text: string; className?: string }) {
  const [currentColors, setCurrentColors] = React.useState(COLORS);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentColors([...COLORS].sort(() => Math.random() - 0.5));
      setCount((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {text.split("").map((char, index) => (
        <motion.span
          key={`${char}-${count}-${index}`}
          initial={{ y: 0 }}
          animate={{
            color: currentColors[index % currentColors.length],
            y: [0, -3, 0],
            scale: [1, 1.01, 1],
            filter: ["blur(0px)", "blur(4px)", "blur(0px)"],
            opacity: [1, 0.85, 1],
          }}
          transition={{ duration: 0.5, delay: index * 0.04 }}
          className={`inline-block whitespace-pre font-sans tracking-tight ${className ?? ""}`}
          style={{ display: char === " " ? "inline" : "inline-block" }}
        >
          {char}
        </motion.span>
      ))}
    </>
  );
}

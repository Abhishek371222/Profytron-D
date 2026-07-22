"use client";

export { TiltCard3D } from "./TiltCard3D";
export { RotatingWords } from "./RotatingWords";
export { GlowPulse } from "./GlowPulse";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export const MagneticWrap = ({
  children,
  strength = 0.3,
}: {
  children: React.ReactNode;
  strength?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  // Throttle to one rAF per frame — prevents 60+ re-renders/sec on mousemove.
  const handleMouseMove = (e: React.MouseEvent) => {
    if (rafRef.current !== null) return;
    const { clientX, clientY } = e;
    rafRef.current = requestAnimationFrame(() => {
      if (ref.current) {
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        setPosition({
          x: (clientX - (left + width / 2)) * strength,
          y: (clientY - (top + height / 2)) * strength,
        });
      }
      rafRef.current = null;
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );
};

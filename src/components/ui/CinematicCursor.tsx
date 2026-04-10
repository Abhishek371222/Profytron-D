"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export function CinematicCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(true); // Assume touch until proven otherwise
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const rafId = useRef<number | null>(null);

  // Spring config for smooth follow
  const springConfig = { damping: 28, stiffness: 120, mass: 0.5 };
  const springX = useSpring(cursorX, springConfig);
  const springY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Hide entirely on touch devices — no cursors exist there
    const hasPointer = window.matchMedia("(pointer: fine)").matches;
    setIsTouchDevice(!hasPointer);
    if (!hasPointer) return;

    // Throttle mousemove to rAF to prevent 100s of updates/sec
    const moveCursor = (e: MouseEvent) => {
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
        rafId.current = null;
      });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", moveCursor, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    document.addEventListener("mouseenter", handleMouseEnter, { passive: true });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [cursorX, cursorY, isVisible]);

  // Don't render anything on touch/mobile devices
  if (isTouchDevice) return null;

  return (
    <>
      {/* Main Spotlight Glow */}
      <motion.div
        className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none z-[9999] mix-blend-screen"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: isVisible ? 1 : 0,
          willChange: "transform",
        }}
      />

      {/* Precision Pointer */}
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 rounded-full border border-primary/50 pointer-events-none z-[9999] flex items-center justify-center translate-x-[-50%] translate-y-[-50%]"
        style={{
          x: springX,
          y: springY,
          opacity: isVisible ? 1 : 0,
          willChange: "transform",
        }}
      >
        <div className="w-1 h-1 bg-primary rounded-full" />
      </motion.div>
    </>
  );
}

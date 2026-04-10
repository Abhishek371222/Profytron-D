"use client";

import React, { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

// 1. FadeUp Wrapper
export const FadeUp = ({ 
  children, 
  delay = 0, 
  duration = 0.5, 
  className 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  duration?: number;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 2. GlowPulse Wrapper
export const GlowPulse = ({ 
  children, 
  color = "rgba(99, 102, 241, 0.15)",
  className 
}: { 
  children: React.ReactNode; 
  color?: string;
  className?: string;
}) => {
  return (
    <motion.div
      animate={{
        boxShadow: [
          `0 0 0 0 ${color}`,
          `0 0 0 15px rgba(99, 102, 241, 0)`,
          `0 0 0 0 rgba(99, 102, 241, 0)`
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={cn("rounded-full", className)}
    >
      {children}
    </motion.div>
  );
};

// 3. StaggerList Wrapper
export const StaggerList = ({ 
  children, 
  stagger = 0.1,
  className 
}: { 
  children: React.ReactNode; 
  stagger?: number;
  className?: string;
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: stagger
      }
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const item = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0 }
  };
  return <motion.div variants={item} className={className}>{children}</motion.div>;
};

// 4. MagneticWrap
export const MagneticWrap = ({ 
  children,
  strength = 0.3
}: { 
  children: React.ReactNode;
  strength?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * strength;
    const y = (clientY - (top + height / 2)) * strength;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

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

// 5. CountUp Animation
export const CountUp = ({ 
  value, 
  duration = 2,
  decimals = 0,
  prefix = "",
  suffix = ""
}: { 
  value: number; 
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) => {
  const [count, setCount] = React.useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const totalSteps = duration * 60;
      const increment = (end - start) / totalSteps;
      
      const timer = setInterval(() => {
        start += increment;
        if ((increment >= 0 && start >= end) || (increment < 0 && start <= end)) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(start);
        }
      }, 1000 / 60);
      
      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{suffix}
    </span>
  );
};

// 6. DrawPath (for SVG)
export const DrawPath = ({ 
  children,
  duration = 2
}: { 
  children: React.ReactElement;
  duration?: number;
}) => {
  return (
    <motion.g
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration, ease: "easeInOut" }}
    >
      {children}
    </motion.g>
  );
};

// 7. Reveal (Side Reveal)
export const Reveal = ({ 
  children,
  width = "fit-content",
  className
}: { 
  children: React.ReactNode;
  width?: "fit-content" | "100%";
  className?: string;
}) => {
  return (
    <div style={{ position: "relative", width, overflow: "hidden" }} className={className}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 25 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        whileInView="visible"
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

"use client";

export { TiltCard3D } from "./TiltCard3D";
export { FloatingOrbs3D } from "./FloatingOrbs3D";
export { RotatingWords } from "./RotatingWords";

import React, { useEffect, useRef } from"react";
import { motion, useInView } from"framer-motion";
import { cn } from"@/lib/utils";

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

export const GlowPulse = ({ 
 children, 
 color ="color-mix(in srgb, var(--primary) 15%, transparent)",
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
 `0 0 0 15px color-mix(in srgb, var(--primary) 0%, transparent)`,
 `0 0 0 0 color-mix(in srgb, var(--primary) 0%, transparent)`
 ]
 }}
 transition={{
 duration: 2,
 repeat: Infinity,
 ease:"easeInOut"
 }}
 className={cn("rounded-full", className)}
 >
 {children}
 </motion.div>
 );
};

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

export const MagneticWrap = ({
 children,
 strength = 0.3
}: {
 children: React.ReactNode;
 strength?: number;
}) => {
 const ref = useRef<HTMLDivElement>(null);
 const rafRef = useRef<number | null>(null);
 const [position, setPosition] = React.useState({ x: 0, y: 0 });

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
 transition={{ type:"spring", stiffness: 150, damping: 15, mass: 0.1 }}
 >
 {children}
 </motion.div>
 );
};

export const CountUp = ({ 
 value, 
 duration = 2,
 decimals = 0,
 prefix ="",
 suffix =""
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
 {prefix}{count.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g,",")}{suffix}
 </span>
 );
};

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
 transition={{ duration, ease:"easeInOut" }}
 >
 {children}
 </motion.g>
 );
};

export const Reveal = ({ 
 children,
 width ="fit-content",
 className
}: { 
 children: React.ReactNode;
 width?:"fit-content" |"100%";
 className?: string;
}) => {
 return (
 <div style={{ position:"relative", width, overflow:"hidden" }} className={className}>
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

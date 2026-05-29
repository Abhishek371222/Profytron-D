'use client';

import * as React from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SliderProps {
 value: number[];
 onValueChange: (value: number[]) => void;
 min: number;
 max: number;
 step?: number;
 className?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
 ({ value, onValueChange, min, max, step = 1, className }, ref) => {
 const val = value[0];
 const percentage = ((val - min) / (max - min)) * 100;
 
 // Smooth motion for background glow
 const springVal = useSpring(percentage, { stiffness: 100, damping: 20 });
 const glowWidth = useTransform(springVal, (p) => `${p}%`);

 const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
 onValueChange([parseInt(e.target.value, 10)]);
 };

 return (
 <div 
 ref={ref}
 className={cn("relative w-full h-12 flex items-center group", className)}
 >
 {/* Track Background */}
 <div className="absolute inset-x-0 h-1.5 bg-white/5 rounded-full overflow-hidden">
 {/* Active Track with Glow */}
 <motion.div 
 style={{ width: glowWidth }}
 className="absolute left-0 top-0 h-full bg-linear-to-r from-p/50 to-p shadow-[0_0_15px_rgba(var(--p-rgb),0.5)] transition-all duration-300"
 />
 </div>

 {/* The Native Input (Invisible but interactive) */}
 <input
 type="range"
 min={min}
 max={max}
 step={step}
 value={val}
 onChange={handleInput}
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
 />

 {/* Visual Thumb (Animated to follow input) */}
 <motion.div
 animate={{ x: `${percentage}%` }}
 transition={{ type: 'spring', stiffness: 300, damping: 30 }}
 className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 z-10 pointer-events-none"
 >
 {/* Central Thumb Body */}
 <div className="w-full h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] flex items-center justify-center relative">
 <div className="w-2 h-2 bg-p rounded-full" />
 
 {/* Magnetic Ring Pulse */}
 <motion.div 
 animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.2, 0.5] }}
 transition={{ duration: 2, repeat: Infinity }}
 className="absolute inset-[-4px] border border-white/30 rounded-full"
 />
 </div>

 {/* Value Tooltip (Optional, can be seen in main component too) */}
 <motion.div 
 animate={{ scale: [0.9, 1], opacity: [0, 1] }}
 className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-white text-bg-base text-xs font-semibold rounded-md whitespace-nowrap shadow-xl"
 >
 {val}
 </motion.div>
 </motion.div>

 {/* Interactive glow spotlight trailing the thumb */}
 <motion.div 
 animate={{ x: `${percentage}%` }}
 className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-40 h-40 bg-p/5 blur-3xl rounded-full pointer-events-none -z-10"
 />
 </div>
 );
 }
);

Slider.displayName = 'Slider';

export { Slider };

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface MagneticProps {
 children: React.ReactNode;
 strength?: number;
}

export function Magnetic({ children, strength = 0.5 }: MagneticProps) {
 const ref = useRef<HTMLDivElement>(null);
 const x = useMotionValue(0);
 const y = useMotionValue(0);

 const springConfig = { damping: 15, stiffness: 150 };
 const springX = useSpring(x, springConfig);
 const springY = useSpring(y, springConfig);

 const handleMouseMove = (e: React.MouseEvent) => {
 const { clientX, clientY } = e;
 const { left, top, width, height } = ref.current!.getBoundingClientRect();
 const centerX = left + width / 2;
 const centerY = top + height / 2;
 
 // Calculate distance from center
 const distanceX = clientX - centerX;
 const distanceY = clientY - centerY;

 x.set(distanceX * strength);
 y.set(distanceY * strength);
 };

 const handleMouseLeave = () => {
 x.set(0);
 y.set(0);
 };

 return (
 <motion.div
 ref={ref}
 onMouseMove={handleMouseMove}
 onMouseLeave={handleMouseLeave}
 style={{ x: springX, y: springY }}
 >
 {children}
 </motion.div>
 );
}

interface TiltProps {
 children: React.ReactNode;
 maxRotation?: number;
}

export function Tilt({ children, maxRotation = 10 }: TiltProps) {
 const ref = useRef<HTMLDivElement>(null);
 const x = useMotionValue(0);
 const y = useMotionValue(0);

 const springConfig = { damping: 20, stiffness: 100 };
 const rotateX = useSpring(y, springConfig);
 const rotateY = useSpring(x, springConfig);

 const handleMouseMove = (e: React.MouseEvent) => {
 const { clientX, clientY } = e;
 const { left, top, width, height } = ref.current!.getBoundingClientRect();
 const centerX = left + width / 2;
 const centerY = top + height / 2;

 const percentX = (clientX - centerX) / (width / 2);
 const percentY = (clientY - centerY) / (height / 2);

 x.set(percentX * maxRotation);
 y.set(percentY * -maxRotation);
 };

 const handleMouseLeave = () => {
 x.set(0);
 y.set(0);
 };

 return (
 <motion.div
 ref={ref}
 onMouseMove={handleMouseMove}
 onMouseLeave={handleMouseLeave}
 style={{ rotateX, rotateY }}
 className="perspective-container"
 >
 {children}
 </motion.div>
 );
}

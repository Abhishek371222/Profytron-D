'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
 label: string;
 icon?: LucideIcon;
 error?: string;
}

export const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
 ({ label, icon: Icon, error, className, id, value, ...props }, ref) => {
 const [isFocused, setIsFocused] = useState(false);
 const hasValue = value !== undefined && value !== null && value !== '';

 return (
 <div className="w-full space-y-1.5 group/input">
 <div className="relative">
 {/* Subtle Input Background Glow */}
 <div className={cn(
"absolute inset-0 rounded-2xl transition-opacity duration-500 blur-xl opacity-0",
 isFocused ?"bg-p/10 opacity-100" :"group-hover/input:bg-white/5 group-hover/input:opacity-50"
 )} />

 <div className="relative flex items-center">
 <input
 id={id}
 ref={ref}
 value={value}
 onFocus={() => setIsFocused(true)}
 onBlur={(e) => {
 setIsFocused(false);
 props.onBlur?.(e);
 }}
 className={cn(
"peer w-full h-16 bg-white/4 backdrop-blur-md border border-white/10 rounded-2xl px-5 pt-6 pb-2 outline-none transition-all duration-300 font-body text-white placeholder-transparent",
"hover:bg-white/6 hover:border-white/20",
 isFocused &&"bg-white/8 border-white/20 ring-1 ring-white/10",
 error &&"border-danger/50 focus:border-danger ring-danger/20",
 className
 )}
 placeholder={label}
 {...props}
 />
 
 <label
 htmlFor={id}
 className={cn(
"absolute left-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none transition-all duration-300 ease-out origin-left font-bold tracking-tight",
 (isFocused || hasValue) &&"translate-y-[-24px] scale-[0.75] text-p"
 )}
 >
 {label}
 </label>

 {Icon && (
 <div className={cn(
"absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300",
 isFocused ?"text-p scale-110" :"text-white/20"
 )}>
 <Icon className="w-5 h-5" />
 </div>
 )}

 {/* Cinematic Focus Line */}
 <div className="absolute bottom-0 left-5 right-5 h-px bg-linear-to-r from-transparent via-white/10 to-transparent overflow-hidden">
 <motion.div 
 initial={{ x: '-100%' }}
 animate={{ x: isFocused ? '100%' : '-100%' }}
 transition={{ duration: 1.5, repeat: Infinity, ease:"linear" }}
 className="w-1/2 h-full bg-linear-to-r from-transparent via-p/50 to-transparent"
 />
 </div>
 </div>
 </div>
 
 <AnimatePresence>
 {error && (
 <motion.p 
 initial={{ opacity: 0, y: -5 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -5 }}
 className="text-xs text-danger font-semibold uppercase tracking-widest px-4"
 >
 {error}
 </motion.p>
 )}
 </AnimatePresence>
 </div>
 );
 }
);

FloatingLabelInput.displayName = 'FloatingLabelInput';

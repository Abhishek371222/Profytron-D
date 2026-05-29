'use client';

import * as React from"react"
import { motion, AnimatePresence } from"framer-motion"
import { ChevronDown, Check } from"lucide-react"
import { cn } from"@/lib/utils"

function Select({ defaultValue, onValueChange, children }: { 
 defaultValue?: string, 
 onValueChange?: (val: string) => void,
 children: React.ReactNode 
}) {
 const [open, setOpen] = React.useState(false);
 const [value, setValue] = React.useState(defaultValue);
 const containerRef = React.useRef<HTMLDivElement>(null);

 React.useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
 setOpen(false);
 }
 };
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 const handleSelect = (val: string) => {
 setValue(val);
 setOpen(false);
 onValueChange?.(val);
 };

 return (
 <div ref={containerRef} className="relative inline-block w-full">
 {React.Children.map(children, child => {
 if (React.isValidElement(child)) {
 return React.cloneElement(child as any, { open, setOpen, value, handleSelect });
 }
 return child;
 })}
 </div>
 );
}

function SelectTrigger({ children, className, open, setOpen, value }: any) {
 return (
 <button
 onClick={() => setOpen(!open)}
 className={cn(
"flex h-9 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-all hover:bg-white/10 outline-none",
 className
 )}
 >
 {children || <span>Select option...</span>}
 <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", open &&"rotate-180")} />
 </button>
 );
}

function SelectValue({ placeholder, value, children }: any) {
 return <span>{value || placeholder}</span>;
}

function SelectContent({ children, open, handleSelect, value, className }: any) {
 return (
 <AnimatePresence>
 {open && (
 <motion.div
 initial={{ opacity: 0, y: 4, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 4, scale: 0.95 }}
 className={cn(
"absolute z-50 mt-2 min-w-[200px] overflow-hidden rounded-2xl border border-white/10 bg-black/80 p-1 shadow-2xl backdrop-blur-xl",
 className
 )}
 >
 {React.Children.map(children, child => {
 if (React.isValidElement(child)) {
 return React.cloneElement(child as any, { handleSelect, currentValue: value });
 }
 return child;
 })}
 </motion.div>
 )}
 </AnimatePresence>
 );
}

function SelectItem({ value, children, handleSelect, currentValue, className }: any) {
 const isSelected = value === currentValue;
 
 return (
 <button
 onClick={() => handleSelect(value)}
 className={cn(
"relative flex w-full cursor-default select-none items-center rounded-xl py-1.5 pl-8 pr-2 text-sm text-white/60 outline-none transition-colors hover:bg-p hover:text-white",
 isSelected &&"text-white bg-white/5",
 className
 )}
 >
 <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
 {isSelected && <Check className="h-4 w-4" />}
 </span>
 {children}
 </button>
 );
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }

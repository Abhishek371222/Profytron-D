'use client';

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

function Switch({ checked, onCheckedChange, className }: { 
 checked?: boolean, 
 onCheckedChange?: (checked: boolean) => void,
 className?: string 
}) {
 const [internalChecked, setInternalChecked] = React.useState(checked ?? false);

 React.useEffect(() => {
  if (checked !== undefined) {
   setInternalChecked(checked);
  }
 }, [checked]);

 const toggle = () => {
 const newVal = !internalChecked;
 setInternalChecked(newVal);
 onCheckedChange?.(newVal);
 };

 return (
 <button
 type="button"
 role="switch"
 aria-checked={internalChecked}
 data-state={internalChecked ? 'checked' : 'unchecked'}
 onClick={toggle}
 className={cn(
"inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-0 p-0.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
 internalChecked ?"bg-primary" :"bg-foreground/20",
 className
 )}
 >
 {/* Flex-centered thumb; motion only slides X so it stays vertically centered. */}
 <motion.span
 aria-hidden
 initial={false}
 animate={{ x: internalChecked ? 20 : 0 }}
 transition={{ type:"spring", stiffness: 500, damping: 30 }}
 className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-[var(--shadow-sm)] ring-0"
 />
 </button>
 );
}

export { Switch }

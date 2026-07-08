'use client';

import * as React from"react"
import { motion } from"framer-motion"
import { cn } from"@/lib/utils"

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
"relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden",
 internalChecked ?"bg-primary" :"bg-foreground/20",
 className
 )}
 >
 <motion.span
 animate={{ x: internalChecked ? 20 : 2 }}
 transition={{ type:"spring", stiffness: 500, damping: 30 }}
 className="pointer-events-none absolute top-0.5 block h-5 w-5 rounded-full bg-background shadow-[var(--shadow-sm)] ring-0"
 />
 </button>
 );
}

export { Switch }

'use client';

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

function Switch({ checked, onCheckedChange, className }: { 
  checked?: boolean, 
  onCheckedChange?: (checked: boolean) => void,
  className?: string 
}) {
  const [internalChecked, setInternalChecked] = React.useState(checked || false);

  const toggle = () => {
    const newVal = !internalChecked;
    setInternalChecked(newVal);
    onCheckedChange?.(newVal);
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "relative h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-p focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        internalChecked ? "bg-p" : "bg-white/20",
        className
      )}
    >
      <motion.span
        animate={{ x: internalChecked ? 16 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0"
      />
    </button>
  );
}

export { Switch }

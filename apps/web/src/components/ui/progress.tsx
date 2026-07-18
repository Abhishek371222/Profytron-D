'use client';

import * as React from"react"
import { motion } from"framer-motion"
import { cn } from"@/lib/utils"

function Progress({ value = 0, className }: { value?: number, className?: string }) {
 const scale = Math.min(Math.max(value, 0), 100) / 100
 return (
 <div className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-foreground/10", className)}>
 <motion.div
 className="h-full w-full origin-left bg-primary shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_50%,transparent)] will-change-transform"
 initial={{ scaleX: 0 }}
 animate={{ scaleX: scale }}
 transition={{ duration: 1, ease:"easeOut" }}
 />
 </div>
 )
}

export { Progress }

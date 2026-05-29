'use client';

import * as React from"react"
import { motion } from"framer-motion"
import { cn } from"@/lib/utils"

function Progress({ value = 0, className }: { value?: number, className?: string }) {
 return (
 <div className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-white/10", className)}>
 <motion.div
 className="h-full bg-p shadow-[0_0_10px_rgba(var(--p-rgb),0.5)]"
 initial={{ width: 0 }}
 animate={{ width: `${value}%` }}
 transition={{ duration: 1, ease:"easeOut" }}
 />
 </div>
 )
}

export { Progress }

'use client';

import * as React from"react"
import { cn } from"@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
 return (
 <input
 type={type}
 className={cn(
"flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-p focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
 className
 )}
 {...props}
 />
 )
}

export { Input }

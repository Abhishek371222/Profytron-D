'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
 return (
 <input
 type={type}
 className={cn(
"flex h-10 w-full rounded-xl border border-border bg-input px-4 py-2 text-body-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-body-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
 className
 )}
 {...props}
 />
 )
}

export { Input }

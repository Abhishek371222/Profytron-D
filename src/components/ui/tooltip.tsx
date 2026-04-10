import React from"react"
import { cn } from"@/lib/utils"

function TooltipProvider({
 children,
}: {
 children: React.ReactNode
 delay?: number
}) {
 return <>{children}</>
}

function Tooltip({ children }: { children: React.ReactNode }) {
 return <>{children}</>
}

function TooltipTrigger({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
 return <>{children}</>
}

function TooltipContent({
 className,
 children,
 ...props
}: React.HTMLAttributes<HTMLDivElement>) {
 return (
 <div
 className={cn(
"z-50 rounded-md bg-foreground px-3 py-1.5 text-xs text-background",
 className
 )}
 {...props}
 >
 {children}
 </div>
 )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

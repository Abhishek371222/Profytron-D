import * as React from"react"

import { cn } from"@/lib/utils"

function Card({
 className,
 size ="default",
 hover = false,
 ...props
}: React.ComponentProps<"div"> & { size?:"default" |"sm"; hover?: boolean }) {
 return (
 <div
 data-slot="card"
 data-size={size}
 className={cn(
  "group/card flex flex-col gap-4 overflow-hidden rounded-[var(--radius-card)] bg-card py-4 text-body-sm text-card-foreground",
  "shadow-[var(--shadow-card)] ring-1 ring-[var(--card-border,var(--border))]",
  "has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0",
  "data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0",
  "*:[img:first-child]:rounded-t-[var(--radius-card)] *:[img:last-child]:rounded-b-[var(--radius-card)]",
  hover && [
    "transition-[transform,box-shadow,border-color] duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform",
    "hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]",
    "hover:ring-[color-mix(in_srgb,var(--primary)_18%,var(--border))]",
  ],
  className
 )}
 {...props}
 />
 )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
 return (
 <div
 data-slot="card-header"
 className={cn(
"group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
 className
 )}
 {...props}
 />
 )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
 return (
 <div
 data-slot="card-title"
 className={cn(
"text-body font-serif font-semibold leading-snug group-data-[size=sm]/card:text-body-sm",
 className
 )}
 {...props}
 />
 )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
 return (
 <div
 data-slot="card-description"
 className={cn("text-body-sm text-muted-foreground", className)}
 {...props}
 />
 )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
 return (
 <div
 data-slot="card-action"
 className={cn(
"col-start-2 row-span-2 row-start-1 self-start justify-self-end",
 className
 )}
 {...props}
 />
 )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
 return (
 <div
 data-slot="card-content"
 className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
 {...props}
 />
 )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
 return (
 <div
 data-slot="card-footer"
 className={cn(
"flex items-center rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/card:p-3",
 className
 )}
 {...props}
 />
 )
}

export {
 Card,
 CardHeader,
 CardFooter,
 CardTitle,
 CardAction,
 CardDescription,
 CardContent,
}

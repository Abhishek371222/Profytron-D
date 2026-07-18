import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center",
    "rounded-button border border-transparent bg-clip-padding",
    "text-body-sm font-semibold whitespace-nowrap",
    "transition-all duration-[var(--motion-fast,120ms)] ease-[var(--ease-out)] outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "shadow-[var(--shadow-cta)]",
          "hover:bg-primary-hover hover:scale-[1.03] hover:-translate-y-px",
          "hover:shadow-[var(--shadow-cta-hover)]",
          "active:bg-primary-active active:scale-[0.97] active:translate-y-0",
        ].join(" "),

        primary: [
          "text-primary-foreground",
          "bg-gradient-cta",
          "shadow-[var(--shadow-cta)]",
          "hover:scale-[1.03] hover:-translate-y-px",
          "hover:shadow-[var(--shadow-cta-hover)]",
          "hover:brightness-110",
          "active:scale-[0.97] active:translate-y-0",
        ].join(" "),

        outline: [
          "border-border bg-transparent text-foreground",
          "hover:bg-muted hover:border-[color-mix(in_srgb,var(--primary)_30%,var(--border))]",
          "hover:scale-[1.02]",
          "active:scale-[0.98]",
        ].join(" "),

        secondary: [
          "bg-secondary text-secondary-foreground border-border",
          "hover:bg-muted hover:scale-[1.02]",
          "active:scale-[0.98]",
        ].join(" "),

        ghost: [
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "hover:scale-[1.02]",
          "active:scale-[0.98]",
        ].join(" "),

        glass: [
          "bg-card/80 backdrop-blur-md border-border text-foreground",
          "shadow-[var(--shadow-sm)]",
          "hover:bg-card hover:scale-[1.02]",
          "hover:shadow-[var(--shadow-md)]",
          "active:scale-[0.98]",
        ].join(" "),

        success: [
          "bg-gradient-success text-success-foreground",
          "shadow-[0_2px_8px_color-mix(in_srgb,var(--success)_25%,transparent)]",
          "hover:scale-[1.03] hover:-translate-y-px",
          "hover:shadow-[0_6px_20px_color-mix(in_srgb,var(--success)_35%,transparent)]",
          "hover:brightness-110",
          "active:scale-[0.97]",
        ].join(" "),

        destructive: [
          "bg-destructive/10 border-destructive/25 text-destructive",
          "hover:bg-destructive/15 hover:border-destructive/40 hover:scale-[1.02]",
          "active:scale-[0.98]",
        ].join(" "),

        link: [
          "text-primary underline-offset-4 hover:underline hover:text-primary-hover",
        ].join(" "),
      },

      size: {
        xs: "h-7 gap-1 rounded-button px-2 text-caption [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 min-h-[var(--touch-min)] gap-1.5 px-3 text-caption [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-[var(--control-h-sm)] min-h-[var(--touch-min)] gap-2 px-5 py-3",
        lg: "h-[var(--control-h)] min-h-[var(--touch-min)] gap-2 px-[var(--control-px)] text-body font-medium",
        xl: "h-[var(--control-h)] gap-2.5 px-8 text-body font-semibold",
        pill: "h-10 gap-2 px-5 rounded-full",
        "pill-sm": "h-8 gap-1.5 px-4 rounded-full text-caption",
        "pill-lg": "h-11 gap-2 px-6 rounded-full text-body",
        icon: "size-10 min-h-[var(--touch-min)] min-w-[var(--touch-min)] rounded-button",
        "icon-xs": "size-8 min-h-[var(--touch-min)] min-w-[var(--touch-min)] rounded-button [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 min-h-[var(--touch-min)] min-w-[var(--touch-min)] rounded-button [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11 min-h-[var(--touch-min)] min-w-[var(--touch-min)] rounded-button",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    const { onClick, type, ...restProps } = props

    const handleClick = (
      event: Parameters<NonNullable<ButtonProps["onClick"]>>[0]
    ) => {
      if (onClick) {
        onClick(event)
      }
    }

    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        disabled={isLoading || restProps.disabled}
        className={cn(buttonVariants({ variant, size, className }))}
        onClick={handleClick}
        type={type}
        {...restProps}
      >
        {isLoading && (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin shrink-0" />
        )}
        {children}
      </ButtonPrimitive>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

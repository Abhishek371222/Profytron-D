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
    "transition-all duration-150 ease outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
    "active:not-aria-[haspopup]:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground shadow-enterprise-sm",
          "hover:bg-[var(--primary-hover)] hover:shadow-enterprise-md",
        ].join(" "),

        primary: [
          "text-primary-foreground bg-gradient-cta shadow-enterprise-sm",
          "hover:shadow-enterprise-md hover:brightness-105",
        ].join(" "),

        outline: [
          "border-border bg-transparent text-foreground",
          "hover:bg-muted hover:border-border",
        ].join(" "),

        secondary: [
          "bg-secondary text-secondary-foreground border-border",
          "hover:bg-muted",
        ].join(" "),

        ghost: [
          "text-muted-foreground hover:text-foreground hover:bg-muted",
        ].join(" "),

        glass: [
          "bg-card/80 backdrop-blur-md border-border text-foreground shadow-enterprise-sm",
          "hover:bg-card hover:shadow-enterprise-md",
        ].join(" "),

        success: [
          "bg-gradient-success text-white shadow-enterprise-sm",
          "hover:shadow-enterprise-md hover:brightness-105",
        ].join(" "),

        destructive: [
          "bg-destructive/10 border-destructive/25 text-destructive",
          "hover:bg-destructive/15 hover:border-destructive/40",
        ].join(" "),

        link: [
          "text-primary underline-offset-4 hover:underline hover:text-[var(--primary-hover)]",
          "active:scale-100",
        ].join(" "),
      },

      size: {
        xs: "h-7 gap-1 rounded-button px-2 text-caption [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-caption [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-10 gap-2 px-6 py-3.5",
        lg: "h-11 gap-2 px-6 text-body",
        xl: "h-12 gap-2.5 px-8 text-body font-bold",
        pill: "h-10 gap-2 px-5 rounded-full",
        "pill-sm": "h-8 gap-1.5 px-4 rounded-full text-caption",
        "pill-lg": "h-11 gap-2 px-6 rounded-full text-body",
        icon: "size-10 rounded-button",
        "icon-xs": "size-7 rounded-button [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-button [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11 rounded-button",
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

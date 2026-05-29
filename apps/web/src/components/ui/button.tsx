import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center",
    "rounded-lg border border-transparent bg-clip-padding",
    "text-sm font-semibold whitespace-nowrap",
    "transition-all duration-200 outline-none select-none",
    "focus-visible:border-indigo-500/60 focus-visible:ring-2 focus-visible:ring-indigo-500/30",
    "active:not-aria-[haspopup]:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-40",
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        /* ── Default: indigo fill ─────────────── */
        default: [
          "bg-indigo-600 text-white border-indigo-500/40",
          "hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.45)]",
          "active:bg-indigo-700",
        ].join(" "),

        /* ── Primary: gradient glow ───────────── */
        primary: [
          "text-white overflow-hidden",
          "bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600",
          "border-indigo-400/30",
          "hover:shadow-[0_0_28px_rgba(99,102,241,0.5),0_4px_16px_rgba(0,0,0,0.3)]",
          "hover:brightness-110",
          "after:content-[''] after:absolute after:inset-y-0 after:w-1/2",
          "after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
          "after:skew-x-[-18deg] after:-translate-x-full",
          "hover:after:translate-x-[300%]",
          "after:transition-transform after:duration-600 after:ease-in-out",
          "after:pointer-events-none",
        ].join(" "),

        /* ── Outline ───────────────────────────── */
        outline: [
          "border-white/[0.1] bg-white/[0.04] text-white/60",
          "hover:bg-white/[0.08] hover:border-white/[0.16] hover:text-white",
          "aria-expanded:bg-white/[0.06] aria-expanded:text-white",
        ].join(" "),

        /* ── Secondary ─────────────────────────── */
        secondary: [
          "bg-white/[0.07] text-white/75 border-white/[0.08]",
          "hover:bg-white/[0.12] hover:text-white hover:border-white/[0.14]",
        ].join(" "),

        /* ── Ghost ─────────────────────────────── */
        ghost: [
          "text-white/50 hover:text-white",
          "hover:bg-white/[0.07]",
        ].join(" "),

        /* ── Glass / frosted ───────────────────── */
        glass: [
          "bg-white/[0.06] backdrop-blur-md border-white/[0.1] text-white/70",
          "hover:bg-white/[0.1] hover:border-white/[0.18] hover:text-white",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        ].join(" "),

        /* ── Cyan accent ───────────────────────── */
        cyan: [
          "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
          "hover:bg-cyan-500/25 hover:border-cyan-400/40 hover:text-cyan-200",
          "hover:shadow-[0_0_18px_rgba(6,182,212,0.35)]",
        ].join(" "),

        /* ── Emerald / success ─────────────────── */
        success: [
          "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
          "hover:bg-emerald-500/25 hover:border-emerald-400/40 hover:text-emerald-200",
          "hover:shadow-[0_0_18px_rgba(52,211,153,0.35)]",
        ].join(" "),

        /* ── Destructive ───────────────────────── */
        destructive: [
          "bg-rose-500/12 border-rose-500/25 text-rose-400",
          "hover:bg-rose-500/22 hover:border-rose-500/40 hover:text-rose-300",
          "hover:shadow-[0_0_18px_rgba(251,113,133,0.35)]",
          "focus-visible:border-rose-500/40 focus-visible:ring-rose-500/20",
        ].join(" "),

        /* ── Link ──────────────────────────────── */
        link: [
          "text-indigo-400 underline-offset-4 hover:underline hover:text-indigo-300",
          "active:scale-100",
        ].join(" "),
      },

      size: {
        xs: "h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-9 gap-1.5 px-3.5",
        lg: "h-11 gap-2 px-5 text-[0.9rem] rounded-xl",
        xl: "h-13 gap-2.5 px-7 text-base rounded-2xl font-bold tracking-wide",
        pill: "h-9 gap-1.5 px-5 rounded-full",
        "pill-sm": "h-7 gap-1 px-4 rounded-full text-[0.8rem]",
        "pill-lg": "h-11 gap-2 px-6 rounded-full text-[0.9rem]",
        icon: "size-9 rounded-lg",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11 rounded-xl",
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
        return
      }
      /* no-op toast removed — wired buttons supply their own handler */
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

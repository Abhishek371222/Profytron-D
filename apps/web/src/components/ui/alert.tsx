import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

type AlertVariant = "default" | "info" | "success" | "warning" | "destructive";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variantStyles: Record<AlertVariant, string> = {
  default: "border-border bg-muted/3 text-foreground/80",
  info: "border-primary/20 bg-primary/[0.06] text-blue-200",
  success: "border-chart-3/20 bg-chart-3/[0.06] text-emerald-200",
  warning: "border-chart-4/20 bg-chart-4/[0.06] text-amber-200",
  destructive: "border-destructive/20 bg-destructive/[0.06] text-rose-200",
};

const variantIcons: Record<AlertVariant, React.ReactNode> = {
  default: <Info className="h-4 w-4 text-foreground/40" />,
  info: <Info className="h-4 w-4 text-chart-5" />,
  success: <CheckCircle2 className="h-4 w-4 text-chart-3" />,
  warning: <TriangleAlert className="h-4 w-4 text-chart-4" />,
  destructive: <AlertCircle className="h-4 w-4 text-destructive" />,
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", children, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-xl border px-4 py-3 text-sm flex gap-3 items-start",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      <span className="mt-0.5 flex-shrink-0">{variantIcons[variant]}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  ),
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h5 ref={ref} className={cn("font-semibold leading-none tracking-tight mb-1", className)} {...props}>
      {children}
    </h5>
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm opacity-80 leading-relaxed", className)} {...props}>
      {children}
    </p>
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };

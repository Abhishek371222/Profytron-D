import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

type AlertVariant = "default" | "info" | "success" | "warning" | "destructive";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variantStyles: Record<AlertVariant, string> = {
  default: "border-border bg-muted/40 text-foreground/80",
  info: "border-info/20 bg-info/[0.08] text-info",
  success: "border-success/20 bg-success/[0.08] text-success",
  warning: "border-warning/20 bg-warning/[0.08] text-warning",
  destructive: "border-destructive/20 bg-destructive/[0.08] text-destructive",
};

const variantIcons: Record<AlertVariant, React.ReactNode> = {
  default: <Info className="h-4 w-4 text-muted-foreground" />,
  info: <Info className="h-4 w-4 text-info" />,
  success: <CheckCircle2 className="h-4 w-4 text-success" />,
  warning: <TriangleAlert className="h-4 w-4 text-warning" />,
  destructive: <AlertCircle className="h-4 w-4 text-destructive" />,
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", children, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-card border px-4 py-3 text-sm flex gap-3 items-start",
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

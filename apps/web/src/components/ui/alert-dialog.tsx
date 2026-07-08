"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
  isLoading = false,
}: AlertDialogProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onOpenChange(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      aria-describedby={description ? "alert-dialog-desc" : undefined}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !isLoading && onOpenChange(false)}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-modal border border-card-border bg-card p-6 shadow-[var(--shadow-modal)] animate-in zoom-in-95 fade-in duration-200">
        <h2 id="alert-dialog-title" className="text-base font-semibold text-foreground mb-2">
          {title}
        </h2>
        {description && (
          <p id="alert-dialog-desc" className="text-sm text-muted-foreground leading-relaxed mb-6">
            {description}
          </p>
        )}
        {!description && <div className="mb-6" />}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center justify-center rounded-button border border-border bg-transparent px-4 text-sm font-medium text-foreground hover:bg-muted transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => { onConfirm(); }}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-button px-4 text-sm font-semibold transition-all disabled:opacity-50 hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground focus-visible:ring-destructive"
                : "bg-primary text-primary-foreground focus-visible:ring-ring",
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("theme") as "dark" | "light" | null;
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<"dark" | "light">("light");

  React.useEffect(() => {
    setMounted(true);
    setTheme(getInitialTheme());
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    const apply = () => {
      setTheme(next);
      localStorage.setItem("theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
    };
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(apply);
    } else {
      apply();
    }
  };

  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const icon = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";

  const label = !mounted
    ? "Toggle theme"
    : theme === "dark"
      ? "Switch to light mode"
      : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      suppressHydrationWarning
      className={cn(
        dim,
        "rounded-button border border-border bg-card text-muted-foreground",
        "hover:text-primary hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]",
        "hover:border-[color-mix(in_srgb,var(--primary)_20%,var(--border))]",
        "transition-all duration-200 ease-out",
        "hover:scale-[1.06] active:scale-[0.94]",
        "flex items-center justify-center shrink-0",
        className,
      )}
    >
      {!mounted ? (
        <span className={cn(icon, "rounded-full bg-muted-foreground/20")} aria-hidden />
      ) : theme === "dark" ? (
        <Sun className={icon} aria-hidden />
      ) : (
        <Moon className={icon} aria-hidden />
      )}
    </button>
  );
}

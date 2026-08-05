"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewTransitionDocument = Document & {
  startViewTransition: (callback: () => void) => {
    finished: Promise<void>;
  };
};

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
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
    setTheme(getInitialTheme());
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.dataset.themeTransitioning === "true") return;

    const next = root.classList.contains("dark") ? "light" : "dark";
    const apply = () => {
      setTheme(next);
      localStorage.setItem("theme", next);
      root.classList.toggle("dark", next === "dark");
      window.dispatchEvent(
        new CustomEvent("profytron:theme-change", {
          detail: { theme: next },
        }),
      );
    };

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!("startViewTransition" in document) || reduceMotion) {
      apply();
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : 0;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    root.style.setProperty("--theme-transition-x", `${x}px`);
    root.style.setProperty("--theme-transition-y", `${y}px`);
    root.style.setProperty("--theme-transition-radius", `${radius}px`);
    root.dataset.themeTransitioning = "true";

    const cleanup = () => {
      delete root.dataset.themeTransitioning;
      root.style.removeProperty("--theme-transition-x");
      root.style.removeProperty("--theme-transition-y");
      root.style.removeProperty("--theme-transition-radius");
    };

    try {
      const transition = (document as ViewTransitionDocument).startViewTransition(
        apply,
      );
      void transition.finished.finally(cleanup);
    } catch {
      cleanup();
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
      ref={buttonRef}
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

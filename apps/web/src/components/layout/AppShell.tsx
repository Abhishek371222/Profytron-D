"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { GlobalCommandPalette } from "./GlobalCommandPalette";
import { MobileBottomNav } from "./MobileBottomNav";
import { useUIStore } from "@/lib/stores/useUIStore";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const syncViewport = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport, { passive: true });
    return () => window.removeEventListener("resize", syncViewport);
  }, [setSidebarOpen]);

  React.useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile, setSidebarOpen]);

  React.useEffect(() => {
    if (!isMobile || !sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, sidebarOpen]);

  React.useEffect(() => {
    if (!isMobile || !sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile, sidebarOpen, setSidebarOpen]);

  const isBuilder = React.useMemo(
    () => pathname?.includes("/strategies/builder"),
    [pathname],
  );

  return (
    <div
      className={cn(
        "flex bg-[var(--bg-secondary)] overflow-x-hidden relative min-w-0",
        isMobile ? "min-h-[100dvh]" : "h-[100dvh] max-h-[100dvh] overflow-hidden",
      )}
      suppressHydrationWarning
    >
      {/* Skip link — first focusable element so keyboard users can bypass the
          sidebar nav on every dashboard page (WCAG 2.4.1 Bypass Blocks). */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Skip to main content
      </a>

      {mounted && !isBuilder && (
        <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--primary)_5%,transparent)_0%,transparent_58%)]" />
      )}

      {isMobile && sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-[var(--overlay)] backdrop-blur-[3px]"
        />
      )}

      <div
        className={cn(
          "transition-transform duration-300 ease-out flex z-40 shrink-0 will-change-transform",
          isMobile
            ? cn(
                "fixed inset-y-0 left-0 pt-safe pb-safe pl-safe",
                sidebarOpen ? "translate-x-0" : "-translate-x-full",
              )
            : "h-[100dvh] py-[var(--sidebar-pad)] pl-[var(--sidebar-pad)]",
        )}
      >
        <Sidebar mobile={isMobile} />
      </div>

      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          "flex-1 min-w-0 relative z-20 w-full flex flex-col focus:outline-none",
          isMobile ? "min-h-[100dvh]" : "min-h-0 h-[100dvh] overflow-hidden",
          !isMobile && "pr-[var(--sidebar-pad)]",
        )}
      >
        <div className="shrink-0 z-30 h-[clamp(3.5rem,4.5vw,4.25rem)] pt-safe">
          <TopBar />
        </div>

        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar",
            isBuilder && "overflow-hidden",
          )}
        >
          <div
            suppressHydrationWarning
            className={cn(
              isBuilder
                ? "p-0 max-w-none w-full h-full min-h-0"
                : "p-[var(--dashboard-p)] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-[clamp(3rem,4vw,4rem)] max-w-[1920px] mx-auto w-full min-w-0",
            )}
          >
            {children}
          </div>
        </div>
      </main>

      <GlobalCommandPalette />
      <MobileBottomNav />
    </div>
  );
}

"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { GlobalCommandPalette } from "./GlobalCommandPalette";
import { MobileBottomNav } from "./MobileBottomNav";
import { useUIStore } from "@/lib/stores/useUIStore";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const AIAssistantOrb = dynamic(
  () => import("@/components/ai/AIAssistantOrb").then((m) => ({ default: m.AIAssistantOrb })),
  { ssr: false },
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [showOrb, setShowOrb] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    let idleId: number | undefined;
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => setShowOrb(true), { timeout: 4000 });
    } else {
      idleId = globalThis.setTimeout(() => setShowOrb(true), 2000) as unknown as number;
    }
    return () => {
      if (typeof window === 'undefined') return;
      if ('cancelIdleCallback' in window && 'requestIdleCallback' in window) {
        window.cancelIdleCallback(idleId as number);
      } else {
        globalThis.clearTimeout(idleId);
      }
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const syncViewport = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, [setSidebarOpen]);

  React.useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile, setSidebarOpen]);

  const isBuilder = React.useMemo(
    () => pathname?.includes("/strategies/builder"),
    [pathname],
  );

  return (
    <div
      className={cn(
        "flex bg-[var(--bg-secondary)] overflow-x-hidden relative",
        isMobile ? "min-h-screen" : "h-[100dvh] max-h-[100dvh] overflow-hidden",
      )}
      suppressHydrationWarning
    >
      {mounted && !isBuilder && (
        <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--primary)_4%,transparent)_0%,transparent_55%)]" />
      )}

      {isMobile && sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-[var(--overlay)] backdrop-blur-[2px]"
        />
      )}

      <div
        className={cn(
          "transition-transform duration-300 flex z-40 shrink-0 will-change-transform",
          isMobile
            ? cn("fixed inset-y-0 left-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")
            : "sticky top-0 h-[100dvh]",
          "w-auto",
        )}
      >
        <Sidebar mobile={isMobile} />
      </div>

      <main
        className={cn(
          "flex-1 min-w-0 relative transition-all duration-300 z-20 w-full flex flex-col",
          isMobile ? "min-h-screen" : "min-h-0 h-[100dvh] overflow-hidden",
        )}
      >
        <div className="shrink-0 z-30 h-16 sm:h-[68px]">
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
                : "p-[var(--dashboard-p)] pb-28 lg:pb-16 max-w-[1800px] mx-auto w-full min-w-0",
            )}
          >
            {children}
          </div>
        </div>
      </main>

      <GlobalCommandPalette />
      <MobileBottomNav />
      {/* Floating orb is desktop-only; mobile uses the dedicated "AI" tab in the bottom nav. */}
      {mounted && showOrb && <AIAssistantOrb />}
    </div>
  );
}

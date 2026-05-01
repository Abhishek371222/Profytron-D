"use client";

import React from"react";
import { Sidebar } from"./Sidebar";
import { TopBar } from"./TopBar";
import { GlobalCommandPalette } from"./GlobalCommandPalette";
import { MobileBottomNav } from"./MobileBottomNav";
import { useUIStore } from"@/lib/stores/useUIStore";
import { cn } from"@/lib/utils";
import { motion } from"framer-motion";
import { usePathname } from"next/navigation";

// Isolated client-only background to prevent hydration mismatches
function BackgroundAmbiance() {
 return (
 <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
 <motion.div
 animate={{
 scale: [1, 1.2, 1],
 opacity: [0.3, 0.4, 0.3],
 x: [0, 50, 0],
 y: [0, -30, 0],
 }}
 transition={{ duration: 15, repeat: Infinity, ease:"linear" }}
 className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-p/10 rounded-full blur-[160px]"
 />
 <motion.div
 animate={{
 scale: [1, 1.1, 1],
 opacity: [0.15, 0.25, 0.15],
 x: [0, -40, 0],
 y: [0, 50, 0],
 }}
 transition={{ duration: 12, repeat: Infinity, ease:"linear", delay: 2 }}
 className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-s/10 rounded-full blur-[140px]"
 />
 </div>
 );
}

export function AppShell({ children }: { children: React.ReactNode }) {
 const { sidebarOpen, setSidebarOpen } = useUIStore();
 const pathname = usePathname();
 const [mounted, setMounted] = React.useState(false);
 const [isMobile, setIsMobile] = React.useState(false);

 React.useEffect(() => {
 setMounted(true);
 }, []);

 React.useEffect(() => {
      if (typeof window === 'undefined') return;

      const syncViewport = () => {
           const mobile = window.innerWidth < 1024;
           setIsMobile(mobile);
           if (mobile) {
                setSidebarOpen(false);
           }
      };

      syncViewport();
      window.addEventListener('resize', syncViewport);
      return () => window.removeEventListener('resize', syncViewport);
 }, [setSidebarOpen]);

 React.useEffect(() => {
      if (isMobile) {
           setSidebarOpen(false);
      }
 }, [pathname, isMobile, setSidebarOpen]);

 const isBuilder = React.useMemo(() => {
 return pathname?.includes("/strategies/builder");
 }, [pathname]);

 return (
 <div
 className="flex min-h-screen bg-bg-base overflow-hidden relative"
 suppressHydrationWarning
 >
 {/* Noise overlay — safe static element */}
 <div
 className="fixed inset-0 pointer-events-none opacity-[0.04] z-[1]"
 style={{
 backgroundImage:
"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
 }}
 aria-hidden="true"
 />

 {/* Animated background — client only, never SSR'd */}
 {mounted && <BackgroundAmbiance />}

 {isMobile && sidebarOpen && (
      <button
           aria-label="Close sidebar"
           onClick={() => setSidebarOpen(false)}
           className="fixed inset-0 z-30 bg-black/55 backdrop-blur-[2px]"
      />
 )}

 <div
 className={cn(
"transition-all duration-500 flex z-40",
 isMobile
      ? cn(
                "fixed inset-y-0 left-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
           )
      : "relative",
 mounted && isBuilder ?"w-0 opacity-0 pointer-events-none overflow-hidden" :"w-auto"
 )}
 >
 <Sidebar mobile={isMobile} />
 </div>

 <main
 className={cn(
"flex-1 min-w-0 flex flex-col h-screen overflow-hidden transition-all duration-300 relative z-20 w-full",
 isBuilder ?"p-0" :""
 )}
 >
 <div
 className={cn(
"transition-all duration-500",
 mounted && isBuilder
 ?"h-0 opacity-0 pointer-events-none overflow-hidden"
 :"h-auto"
 )}
 >
 <TopBar />
 </div>

 <div
 className={cn(
"flex-1 min-w-0 overflow-y-auto overflow-x-hidden custom-scrollbar",
 mounted && isBuilder ?"p-0" :""
 )}
 >
 <motion.div
 key={pathname}
 initial={{ opacity: 0, y: 5 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -5 }}
 transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
 suppressHydrationWarning
 className={
 mounted && isBuilder
 ?"p-0 max-w-none w-full h-full"
 :"p-[var(--dashboard-p)] pb-24 sm:pb-10 lg:pb-12 max-w-[1800px] mx-auto w-full min-w-0 flex-col flex min-h-full"
 }
 >
 {children}
 </motion.div>
 </div>
 </main>

 {/* Edge Accents */}
 <div className="fixed top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/5 to-transparent z-[100] pointer-events-none" />
 <div className="fixed bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/5 to-transparent z-[100] pointer-events-none" />
      <GlobalCommandPalette />
      <MobileBottomNav />
 </div>
 );
}

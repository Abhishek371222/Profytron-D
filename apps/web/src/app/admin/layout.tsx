"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/components/providers/AppProviders";
import { LayoutDashboard, ShieldCheck, LogOut, ChevronLeft, AlertTriangle } from "@/components/ui/icons";
import { Users as UsersIcon, Shield as ShieldIcon, Server as ServerIcon, Bot, Menu, Headset, FileCheck, BarChart3 } from "lucide-react";
import { useDensityProfile } from "@/lib/hooks/useDensityProfile";

const adminNavItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { name: "Users", icon: UsersIcon, href: "/admin/users" },
  { name: "Strategies", icon: ShieldIcon, href: "/admin/strategies" },
  { name: "KYC Review", icon: FileCheck, href: "/admin/kyc" },
  { name: "Alpha Coach", icon: Headset, href: "/admin/coach" },
  { name: "Coach Insights", icon: BarChart3, href: "/admin/coach-insights" },
  { name: "System", icon: ServerIcon, href: "/admin/system" },
  { name: "AI Workforce", icon: Bot, href: "/admin/agents" },
];

function AdminSidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const expanded = mobile ? true : sidebarOpen;

  return (
    <motion.aside
      initial={false}
      animate={{ width: mobile ? "var(--sidebar-w)" : !mounted ? 220 : sidebarOpen ? 220 : 80 }}
      className={cn(
        "relative flex h-full min-h-0 flex-col border-r border-[var(--card-border)] bg-card z-40 transition-all duration-300",
        !mobile && (!mounted || !sidebarOpen) && "items-center",
      )}
      suppressHydrationWarning
    >
      <div className="flex h-[clamp(3.5rem,4.5vw,4.25rem)] shrink-0 items-center justify-between border-b border-[var(--card-border)] px-4">
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <ShieldCheck className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold tracking-tight text-foreground">ADMIN</span>
            </motion.div>
          )}
        </AnimatePresence>
        {!expanded && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>

      <nav aria-label="Admin navigation" className="flex-1 space-y-2 overflow-y-auto px-3 py-6">
        {adminNavItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : Boolean(pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-label={!expanded ? item.name : undefined}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex h-11 min-h-[var(--touch-min)] items-center rounded-lg transition-all group",
                isActive
                  ? "border border-primary/20 bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                !expanded && "justify-center",
              )}
            >
              <div className={cn("flex items-center gap-3", expanded ? "px-4" : "px-0")}>
                <item.icon className={cn("h-5 w-5 transition-transform", !isActive && "group-hover:scale-110")} />
                {expanded && <span>{item.name}</span>}
              </div>
              {isActive && (
                <motion.div layoutId="admin-active-indicator" className="absolute left-0 h-6 w-1 rounded-r-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-[var(--card-border)] p-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cn(
            "flex h-11 min-h-[var(--touch-min)] items-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground group",
            !expanded && "justify-center",
          )}
        >
          <div className={cn("flex items-center gap-3", expanded ? "px-4" : "px-0")}>
            <LogOut className="h-5 w-5" />
            {expanded && <span>Exit Admin</span>}
          </div>
        </Link>

        {!mobile && (
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-10 min-h-[var(--touch-min)] w-full items-center justify-center rounded-lg border border-[var(--card-border)] bg-card transition-colors hover:bg-muted"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <ChevronLeft className={cn("h-4 w-4 text-muted-foreground", !sidebarOpen && "rotate-180")} />
          </button>
        )}
      </div>
    </motion.aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AdminAuthGate>{children}</AdminAuthGate>
    </AppProviders>
  );
}

function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isHydrating } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const density = useDensityProfile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const sync = () => setIsMobile(window.innerWidth < 1024);
    sync();
    window.addEventListener("resize", sync, { passive: true });
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobile || !mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, mobileOpen]);

  useEffect(() => {
    if (isHydrating) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/admin")}`);
      return;
    }
    if (user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [isHydrating, isAuthenticated, user, router, pathname]);

  if (isHydrating) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background text-muted-foreground">
        Authenticating…
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background text-muted-foreground">
        Redirecting…
      </div>
    );
  }

  return (
    <div data-density={density} className="flex h-[100dvh] min-w-0 overflow-hidden bg-background font-sans text-foreground">
      {isMobile && mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-[var(--overlay)] backdrop-blur-[3px]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={cn(
          "z-40 shrink-0 transition-transform duration-300 ease-out",
          isMobile
            ? cn("fixed inset-y-0 left-0 pt-safe pb-safe pl-safe", mobileOpen ? "translate-x-0" : "-translate-x-full")
            : "relative h-full",
        )}
      >
        <AdminSidebar mobile={isMobile} onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative flex h-10 shrink-0 items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 text-sm font-medium text-amber-600">
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="absolute left-3 flex h-9 w-9 min-h-[var(--touch-min)] min-w-[var(--touch-min)] items-center justify-center rounded-lg border border-amber-500/25 bg-card/80"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="truncate text-center text-xs sm:text-sm">ADMIN MODE — Actions here affect all users</span>
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-[var(--dashboard-p)]">{children}</main>
      </div>
    </div>
  );
}

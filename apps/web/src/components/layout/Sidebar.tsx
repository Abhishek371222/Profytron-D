"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Library,
  Zap,
  ShoppingBag,
  History,
  Settings,
  ChevronLeft,
  Sparkles,
  Wallet,
  Network,
  Trophy,
  BookOpen,
  Server,
  Bell,
  Shield,
} from "@/components/ui/icons";
import { cn, isAdminUser } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/useUIStore";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { UserAvatar } from "@/components/ui/UserAvatar";

const navItems = [
  { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "AI Coach", icon: Sparkles, href: "/ai-coach" },
  { name: "Wallet", icon: Wallet, href: "/wallet" },
  { name: "Strategies", icon: Library, href: "/strategies" },
  { name: "Builder", icon: Zap, href: "/strategies/builder" },
  { name: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
  { name: "Journal", icon: BookOpen, href: "/journal" },
  { name: "History", icon: History, href: "/history" },
  { name: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  { name: "Bots", icon: Server, href: "/bots" },
  { name: "Copy Trading", icon: Zap, href: "/copy-trading" },
  { name: "Notifications", icon: Bell, href: "/notifications", badge: 3 },
  { name: "Affiliate", icon: Network, href: "/affiliate" },
];

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const { data: user } = useCurrentUser();
  const expanded = mobile ? true : sidebarOpen;
  const showAdminLink = isAdminUser(user);

  const handleBrandClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    router.push("/");
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: mobile ? 280 : !mounted ? 260 : sidebarOpen ? 260 : 80 }}
      transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
      className={cn(
        "relative h-full min-h-[100dvh] flex flex-col bg-sidebar border-r border-[var(--sidebar-border)] z-40 shrink-0 overflow-hidden",
        !mounted || !expanded ? "items-center" : "",
      )}
      suppressHydrationWarning
    >
      <Link
        href="/"
        onClick={handleBrandClick}
        className="relative flex items-center h-[68px] px-4 w-full border-b border-[var(--card-border)]"
        aria-label="Profytron Home"
      >
        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-9 h-9 rounded-[10px] bg-primary/10 border border-primary/15 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-sm tracking-tight text-foreground">
                  PROFY<span className="text-primary">TRON</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                  Trading OS
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              className="w-9 h-9 rounded-[10px] bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto"
            >
              <Zap className="w-4 h-4 text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "dash-nav-link group/nav relative",
                isActive && "dash-nav-link-active",
                !expanded && "justify-center w-10 mx-auto",
              )}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-[10px] bg-[color-mix(in_srgb,var(--primary)_9%,transparent)] pointer-events-none" />
              )}
              <div className={cn("relative flex items-center gap-2.5 w-full", expanded ? "pl-3 pr-2" : "justify-center")}>
                <item.icon className={cn(
                  "shrink-0 transition-colors duration-150",
                  "w-[18px] h-[18px]",
                  isActive ? "text-primary" : "text-muted-foreground group-hover/nav:text-foreground"
                )} />
                {expanded && <span className="truncate">{item.name}</span>}
                {expanded && "badge" in item && item.badge != null && (
                  <span className="ml-auto flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1.5 text-[9px] font-bold text-primary-foreground shadow-[0_2px_6px_color-mix(in_srgb,var(--primary)_35%,transparent)]">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        {showAdminLink && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center h-10 rounded-[10px] text-sm font-medium mt-2 border border-destructive/20",
              pathname?.startsWith("/admin")
                ? "bg-destructive/10 text-destructive"
                : "text-destructive/80 hover:bg-destructive/5",
              !expanded && "justify-center w-10 mx-auto",
            )}
          >
            <div className={cn("flex items-center gap-2.5", expanded ? "px-3" : "justify-center")}>
              <Shield className="w-[18px] h-[18px]" />
              {expanded && <span>Admin</span>}
            </div>
          </Link>
        )}
      </nav>

      <div className="p-2 border-t border-[var(--card-border)] space-y-1 shrink-0">
        {user && (
          <div className={cn("flex items-center gap-2.5 p-2 rounded-[10px]", !expanded && "justify-center")}>
            <UserAvatar name={user.fullName || "User"} size="sm" />
            {expanded && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.fullName || "User"}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {user.subscriptionTier || "FREE"}
                </p>
              </div>
            )}
          </div>
        )}
        <Link
          href="/settings"
          className={cn("dash-nav-link", !expanded && "justify-center w-10 mx-auto")}
        >
          <div className={cn("flex items-center gap-2.5", expanded ? "pl-3" : "justify-center")}>
            <Settings className="w-4 h-4" />
            {expanded && <span>Settings</span>}
          </div>
        </Link>
        {!mobile && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full h-9 rounded-[10px] border border-[var(--sidebar-border)] text-muted-foreground hover:text-foreground hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] hover:border-[color-mix(in_srgb,var(--primary)_20%,var(--sidebar-border))] transition-all duration-200 text-xs font-medium group"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", !sidebarOpen && "rotate-180")} />
            {expanded && <span className="ml-1.5">Collapse</span>}
          </button>
        )}
      </div>
    </motion.aside>
  );
}

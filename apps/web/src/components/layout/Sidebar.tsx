"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Library,
  Zap,
  ShoppingBag,
  History,
  ShieldCheck,
  Settings,
  ChevronLeft,
  Sparkles,
  Wallet,
  Network,
  Trophy,
  BookOpen,
  Server,
  Bell,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/useUIStore";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useAuthStore } from "@/lib/stores/useAuthStore";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "AI Coach", icon: Sparkles, href: "/ai-coach" },
  { name: "Wallet", icon: Wallet, href: "/wallet" },
  { name: "Strategy Library", icon: Library, href: "/strategies" },
  { name: "Strategy Builder", icon: Zap, href: "/strategies/builder" },
  { name: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
  { name: "My Trades", icon: BookOpen, href: "/journal" },
  { name: "Trade History", icon: History, href: "/history" },
  { name: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  { name: "Trading Bots", icon: Server, href: "/bots" },
  { name: "Notifications", icon: Bell, href: "/notifications" },
  { name: "Affiliate", icon: Network, href: "/affiliate" },
];

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { logout, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: user, isLoading } = useCurrentUser();
  const expanded = mobile ? true : sidebarOpen;

  const handleBrandClick = async (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    event.preventDefault();

    if (isAuthenticated) {
      await logout();
    }

    router.replace('/');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: mobile ? 280 : (!mounted ? 260 : (sidebarOpen ? 260 : 80)) }}
      className={cn(
        "relative h-[100dvh] flex flex-col glass border-r border-border-default z-40 transition-all duration-300",
        (!mounted || !expanded) && "items-center"
      )}
      suppressHydrationWarning
    >
      {/* Premium top hairline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

      {/* Ambient corner glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-48 h-48 rounded-full bg-indigo-500/[0.08] blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-violet-500/[0.06] blur-[80px]" />

      {/* ─────────── LOGO ─────────── */}
      <Link
        href="/"
        onClick={handleBrandClick}
        className="relative flex items-center justify-between h-20 px-5 w-full text-left cursor-pointer group/brand"
        aria-label="Profytron Home"
      >
        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2.5"
            >
              <div className="relative w-9 h-9 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500" />
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"
                />
                <div className="relative w-full h-full flex items-center justify-center">
                  <BarChart3 className="text-white w-5 h-5 drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]" />
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-bold text-[15px] tracking-[0.18em] bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-clip-text text-transparent">
                  PROFYTRON
                </span>
                <span className="text-[8px] font-bold uppercase tracking-[0.32em] text-white/30 mt-1">Trading OS</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="relative w-9 h-9 rounded-xl overflow-hidden mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500" />
              <BarChart3 className="relative text-white w-5 h-5 m-auto mt-2" />
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      {/* ─────────── NAV ─────────── */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item, idx) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center h-11 rounded-xl transition-all duration-200 group/nav overflow-hidden",
                isActive
                  ? "text-white font-semibold"
                  : "text-white/45 hover:text-white",
                !expanded && "justify-center",
              )}
            >
              {/* Active background — gradient */}
              {isActive && (
                <motion.div
                  layoutId="nav-active-bg"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 via-indigo-500/15 to-transparent border border-indigo-400/25"
                  style={{ boxShadow: '0 0 24px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.05)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}

              {/* Hover background */}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl bg-white/0 group-hover/nav:bg-white/[0.04] transition-colors duration-200" />
              )}

              {/* Active left bar */}
              {isActive && (
                <motion.div
                  layoutId="nav-active-bar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-indigo-400 to-violet-400 rounded-r-full"
                  style={{ boxShadow: '0 0 8px #818cf8' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}

              <div className={cn("relative flex items-center gap-3 w-full", expanded ? "px-3.5" : "justify-center")}>
                <item.icon className={cn(
                  "w-[18px] h-[18px] shrink-0 transition-all duration-200",
                  isActive
                    ? "text-indigo-300"
                    : "group-hover/nav:scale-110 group-hover/nav:text-indigo-300",
                )} />
                {expanded && (
                  <span className="text-[13px] tracking-[0.01em] whitespace-nowrap">{item.name}</span>
                )}
                {expanded && isActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"
                    style={{ boxShadow: '0 0 6px #818cf8' }}
                  />
                )}
              </div>

              {/* Tooltip for collapsed */}
              {!expanded && (
                <div className="absolute left-[64px] z-50 px-2.5 py-1.5 rounded-lg bg-[#0d0d18] border border-white/[0.12] text-[11px] font-bold text-white opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible pointer-events-none whitespace-nowrap shadow-2xl transition-all duration-150 translate-x-[-4px] group-hover/nav:translate-x-0">
                  {item.name}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#0d0d18]" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ─────────── FOOTER ─────────── */}
      <div className="relative p-3 space-y-2 shrink-0 border-t border-white/[0.05]">
        {/* User card */}
        {isLoading ? (
          <div className={cn("flex items-center gap-3 p-2 rounded-xl bg-white/[0.025] shimmer", !expanded && "justify-center px-0")}>
            <div className="w-9 h-9 rounded-full bg-white/[0.08] shrink-0" />
            {expanded && (
              <div className="space-y-1.5 flex-1">
                <div className="h-2.5 bg-white/[0.08] rounded w-2/3" />
                <div className="h-2 bg-white/[0.05] rounded w-1/2" />
              </div>
            )}
          </div>
        ) : user ? (
          <div className={cn(
            "relative flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer group/user overflow-hidden",
            !expanded && "justify-center px-0",
          )}>
            <div className="relative shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-9 h-9 rounded-full object-cover border-2 border-indigo-400/30 group-hover/user:border-indigo-400/60 transition-colors"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border-2 border-indigo-400/30 group-hover/user:border-indigo-400/60 flex items-center justify-center transition-colors">
                  <span className="text-white font-bold text-xs">{user.fullName?.charAt(0)?.toUpperCase() || 'U'}</span>
                </div>
              )}
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0c0c14]" style={{ boxShadow: '0 0 6px #34d399' }} />
            </div>
            {expanded && (
              <div className="flex flex-col truncate flex-1 min-w-0">
                <span className="text-[13px] font-semibold text-white truncate">{user.fullName || 'Operative'}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                    {user.subscriptionTier || 'FREE'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Settings link */}
        <Link
          href="/settings"
          className={cn(
            "relative flex items-center h-10 rounded-xl text-white/45 hover:text-white hover:bg-white/[0.04] transition-all group/set",
            !expanded && "justify-center",
          )}
        >
          <div className={cn("flex items-center gap-3 w-full", expanded ? "px-3.5" : "justify-center")}>
            <Settings className="w-[18px] h-[18px] shrink-0 group-hover/set:rotate-45 transition-transform duration-500" />
            {expanded && <span className="text-[13px] tracking-[0.01em]">Settings</span>}
          </div>
        </Link>

        {/* Collapse toggle */}
        {!mobile && (
          <button
            onClick={toggleSidebar}
            className="relative flex items-center justify-center w-full h-9 rounded-lg border border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.06] hover:border-white/[0.12] text-white/35 hover:text-white/70 transition-all group/toggle"
          >
            <ChevronLeft
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-300",
                !sidebarOpen && "rotate-180",
              )}
            />
            {expanded && (
              <span className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.18em]">Collapse</span>
            )}
          </button>
        )}
      </div>
    </motion.aside>
  );
}

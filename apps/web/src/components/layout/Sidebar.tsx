"use client";

import React from "react";
import Link from "next/link";
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
  TrendingUp,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/useUIStore";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "AI Coach", icon: Sparkles, href: "/ai-coach" },
  { name: "Wallet", icon: Wallet, href: "/wallet" },
  { name: "Strategy Library", icon: Library, href: "/strategies" },
  { name: "Strategy Builder", icon: Zap, href: "/strategies/builder" },
  { name: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
  { name: "Trade History", icon: History, href: "/history" },
  { name: "Risk DNA", icon: ShieldCheck, href: "/onboarding/risk" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: user, isLoading } = useCurrentUser();

  return (
    <motion.aside
      initial={false}
      animate={{ width: !mounted ? 260 : (sidebarOpen ? 260 : 80) }}
      className={cn(
        "relative h-screen flex flex-col glass border-r border-border-default z-40 transition-all duration-300",
        (!mounted || !sidebarOpen) && "items-center"
      )}
      suppressHydrationWarning
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-20 px-6">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-p flex items-center justify-center">
                <BarChart3 className="text-white w-5 h-5" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-gradient">
                PROFYTRON
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {(!sidebarOpen) && (
          <div className="w-8 h-8 rounded-lg bg-p/20 flex items-center justify-center">
            <BarChart3 className="text-p w-5 h-5" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 py-4 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center h-12 rounded-xl transition-all relative group",
                isActive 
                  ? "bg-p/10 text-p font-medium shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                  : "text-slate-400 hover:text-white hover:bg-white/5",
                !sidebarOpen && "justify-center"
              )}
            >
              <div className={cn("flex items-center gap-3", sidebarOpen ? "px-4" : "px-0")}>
                <item.icon className={cn("w-5 h-5 transition-transform", !isActive && "group-hover:scale-110")} />
                {sidebarOpen && <span>{item.name}</span>}
              </div>
              
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute left-0 w-1 h-6 bg-p rounded-r-full"
                />
              )}
              
              {!sidebarOpen && (
                <div className="absolute left-16 px-2 py-1 bg-bg-elevated border border-border-default rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-2">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl border border-white/8 bg-gradient-to-br from-white/6 via-white/3 to-transparent p-3 shadow-[0_18px_40px_rgba(0,0,0,0.18)]",
            !sidebarOpen && "hidden",
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30">Affiliate Hub</p>
              <p className="mt-1 text-xs text-white/60">Explore your network and top earners.</p>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
              New
            </div>
          </div>

          <div className="relative mb-3 h-20 overflow-hidden rounded-2xl border border-white/5 bg-black/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_55%)]" />
            <motion.div
              className="absolute left-4 top-4 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.7)]"
              animate={{ y: [0, 6, 0], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute left-10 top-8 h-1.5 w-1.5 rounded-full bg-cyan-300"
              animate={{ y: [0, -5, 0], x: [0, 6, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            />
            <motion.div
              className="absolute left-16 top-3 h-1.5 w-1.5 rounded-full bg-indigo-300"
              animate={{ y: [0, 7, 0], x: [0, 8, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut', delay: 0.45 }}
            />
            <motion.div
              className="absolute right-5 bottom-5 h-3 w-3 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.45)]"
              animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 220 80" fill="none" aria-hidden="true">
              <motion.path
                d="M18 20 C 48 24, 72 28, 98 42 S 142 58, 190 58"
                stroke="rgba(148,163,184,0.35)"
                strokeWidth="1.5"
                strokeDasharray="5 6"
                animate={{ pathLength: [0.3, 1, 0.3] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.path
                d="M32 58 C 62 50, 86 38, 104 24 S 154 12, 202 18"
                stroke="rgba(99,102,241,0.35)"
                strokeWidth="1.5"
                strokeDasharray="4 8"
                animate={{ pathLength: [1, 0.5, 1] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              />
            </svg>
          </div>

          <div className="grid gap-2">
            <Link href="/affiliate" className="flex items-center justify-between rounded-xl border border-white/5 bg-white/4 px-3 py-2 text-xs text-white/80 transition-colors hover:border-p/30 hover:bg-p/10 hover:text-white">
              <span>Affiliate Tree</span>
              <Network className="h-4 w-4 text-p" />
            </Link>
            <Link href="/affiliate/best" className="flex items-center justify-between rounded-xl border border-white/5 bg-white/4 px-3 py-2 text-xs text-white/80 transition-colors hover:border-p/30 hover:bg-p/10 hover:text-white">
              <span>Best Affiliates</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* User Profile & Settings */}
      <div className="p-4 space-y-2 border-t border-white/5 flex flex-col shrink-0">
          
        {isLoading ? (
          <div className={cn("flex items-center gap-3 p-2 rounded-xl bg-white/5 animate-pulse", !sidebarOpen && "justify-center px-0")}>
            <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
            {sidebarOpen && (
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-white/10 rounded w-2/3" />
                <div className="h-2 bg-white/10 rounded w-1/2" />
              </div>
            )}
          </div>
        ) : user ? (
          <div className={cn("flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group", !sidebarOpen && "justify-center px-0")}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10 group-hover:border-p transition-colors" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-p/20 border border-p/30 flex items-center justify-center shrink-0">
                <span className="text-p font-bold text-xs">{user.fullName?.charAt(0) || 'U'}</span>
              </div>
            )}
            {sidebarOpen && (
              <div className="flex flex-col truncate flex-1">
                <span className="text-sm font-semibold text-white truncate">{user.fullName || 'Operative'}</span>
                <span className="text-xs text-white/40 uppercase tracking-widest">{user.subscriptionTier || 'FREE'}</span>
              </div>
            )}
          </div>
        ) : null}

        <Link
          href="/settings"
          className={cn(
            "flex items-center h-12 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group",
            !sidebarOpen && "justify-center"
          )}
        >
          <div className={cn("flex items-center gap-3", sidebarOpen ? "px-4" : "px-0")}>
            <Settings className="w-5 h-5" />
            {sidebarOpen && <span>Settings</span>}
          </div>
        </Link>
        
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full h-10 rounded-lg border border-border-faint bg-white/5 hover:bg-white/10 transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4 rotate-180" />}
        </button>
      </div>
    </motion.aside>
  );
}

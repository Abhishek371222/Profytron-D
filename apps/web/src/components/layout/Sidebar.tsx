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
  { name: "Affiliate", icon: Network, href: "/affiliate" },
];

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: user, isLoading } = useCurrentUser();
  const expanded = mobile ? true : sidebarOpen;

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
      {/* Logo */}
      <div className="flex items-center justify-between h-20 px-6">
        <AnimatePresence>
          {expanded && (
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
        
        {(!expanded) && (
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
                !expanded && "justify-center"
              )}
            >
              <div className={cn("flex items-center gap-3", expanded ? "px-4" : "px-0")}>
                <item.icon className={cn("w-5 h-5 transition-transform", !isActive && "group-hover:scale-110")} />
                {expanded && <span>{item.name}</span>}
              </div>
              
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute left-0 w-1 h-6 bg-p rounded-r-full"
                />
              )}
              
              {!expanded && (
                <div className="absolute left-16 px-2 py-1 bg-bg-elevated border border-border-default rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Settings */}
      <div className="p-4 space-y-2 border-t border-white/5 flex flex-col shrink-0">
          
        {isLoading ? (
          <div className={cn("flex items-center gap-3 p-2 rounded-xl bg-white/5 animate-pulse", !expanded && "justify-center px-0")}>
            <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
            {expanded && (
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-white/10 rounded w-2/3" />
                <div className="h-2 bg-white/10 rounded w-1/2" />
              </div>
            )}
          </div>
        ) : user ? (
          <div className={cn("flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group", !expanded && "justify-center px-0")}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10 group-hover:border-p transition-colors" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-p/20 border border-p/30 flex items-center justify-center shrink-0">
                <span className="text-p font-bold text-xs">{user.fullName?.charAt(0) || 'U'}</span>
              </div>
            )}
            {expanded && (
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
            !expanded && "justify-center"
          )}
        >
          <div className={cn("flex items-center gap-3", expanded ? "px-4" : "px-0")}>
            <Settings className="w-5 h-5" />
            {expanded && <span>Settings</span>}
          </div>
        </Link>
        
        {!mobile && (
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full h-10 rounded-lg border border-border-faint bg-white/5 hover:bg-white/10 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4 rotate-180" />}
          </button>
        )}
      </div>
    </motion.aside>
  );
}

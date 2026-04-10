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
  X,
  ChevronLeft,
  Sparkles,
  Wallet,
  MessageSquare
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/useUIStore";
import { motion, AnimatePresence } from "framer-motion";

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
      <nav className="flex-1 px-3 space-y-1 py-4">
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

      {/* Footer / Settings */}
      <div className="p-4 space-y-2">
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

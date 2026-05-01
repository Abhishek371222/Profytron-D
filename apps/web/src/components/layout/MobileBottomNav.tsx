"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  Wallet,
  ShoppingBag,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const bottomNavItems = [
  { name: "Home", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "AI", icon: Sparkles, href: "/ai-coach" },
  { name: "Wallet", icon: Wallet, href: "/wallet" },
  { name: "Market", icon: ShoppingBag, href: "/marketplace" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const isBuilder = pathname?.includes("/strategies/builder");

  if (isBuilder) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden">
      <div className="bg-[#080808]/90 backdrop-blur-2xl border-t border-white/5 safe-area-inset-bottom">
        <div className="flex items-stretch h-16">
          {bottomNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 gap-1 transition-colors",
                  isActive ? "text-p" : "text-white/30 hover:text-white/60"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute top-0 inset-x-2 h-0.5 bg-p rounded-b-full"
                  />
                )}
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-transform",
                    isActive && "scale-110"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-widest",
                    isActive ? "text-p" : "text-white/30"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

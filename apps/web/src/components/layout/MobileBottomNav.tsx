"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  ShoppingBag,
  Library,
  Bell,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications";

const bottomNavItems = [
  { name: "Home",       icon: LayoutDashboard, href: "/dashboard"     },
  { name: "Market",     icon: ShoppingBag,     href: "/marketplace"   },
  { name: "Strategies", icon: Library,         href: "/strategies"    },
  { name: "AI",         icon: Sparkles,        href: "/ai-coach"      },
  { name: "Alerts",     icon: Bell,            href: "/notifications" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const isBuilder = pathname?.includes("/strategies/builder");
  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () => notificationsApi.unreadCount(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const unreadCount = unreadData?.count ?? 0;

  if (isBuilder) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden">
      {/* Gradient fade above the bar */}
      <div className="pointer-events-none absolute -top-8 inset-x-0 h-8 bg-gradient-to-t from-[var(--sidebar)]/60 to-transparent" />

      <div className="relative">
        {/* Glass background */}
        <div className="absolute inset-0 bg-[var(--sidebar)]/90 backdrop-blur-2xl border-t border-[var(--sidebar-border)]" />
        {/* Top accent hairline */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--primary)_35%,transparent)] to-transparent" />

        <div className="relative flex items-stretch h-16 pb-safe">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 min-w-0 px-1 gap-1 transition-colors duration-200",
                  isActive ? "text-primary" : "text-foreground/25 hover:text-foreground/50",
                )}
              >
                {/* Active top bar */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-bar"
                    className="absolute top-0 inset-x-4 h-[2px] rounded-b-full bg-gradient-to-r from-[#47a7aa] to-[#1e6d48]"
                    style={{ boxShadow: "0 0 10px rgba(71,167,170,0.55)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}

                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-bg"
                    className="absolute inset-x-2 inset-y-1.5 rounded-xl bg-primary/10 border border-primary/15"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}

                <div className="relative">
                  <Icon className={cn("w-5 h-5 transition-transform duration-200", isActive && "scale-110")} />
                  {item.name === "Alerts" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-primary text-[8px] font-bold text-primary-foreground flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>

                <span className={cn(
                  "relative w-full text-center leading-none text-micro font-bold uppercase tracking-[0.06em] transition-colors duration-200",
                  isActive ? "text-primary" : "text-foreground/20",
                )}>
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

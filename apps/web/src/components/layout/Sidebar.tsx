"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChevronLeft,
  Sparkles,
  Wallet,
  Network,
  Trophy,
  Server,
  ShoppingBag,
  CreditCard,
  Unplug,
  Shield,
} from "@/components/ui/icons";
import { cn, isAdminUser } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/useUIStore";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { BrandLogo } from "@/components/brand/BrandLogo";

type NavItem = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
};

type NavGroup = {
  id: string;
  label: string;
  emoji: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    emoji: "🏠",
    items: [
      { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
      { name: "AI Assistant", icon: Sparkles, href: "/ai-coach" },
    ],
  },
  {
    id: "trading",
    label: "Trading",
    emoji: "🤖",
    items: [
      { name: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
      { name: "My Bots", icon: Server, href: "/my-bots" },
      { name: "Connected Accounts", icon: Unplug, href: "/connected-accounts" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    emoji: "💰",
    items: [
      { name: "Wallet", icon: Wallet, href: "/wallet" },
      { name: "Subscription", icon: CreditCard, href: "/subscriptions" },
    ],
  },
  {
    id: "community",
    label: "Community",
    emoji: "🏆",
    items: [
      { name: "Leaderboard", icon: Trophy, href: "/leaderboard" },
      { name: "Affiliate Program", icon: Network, href: "/affiliate" },
    ],
  },
];

function isItemActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
      {/* Brand */}
      <Link
        href="/"
        onClick={handleBrandClick}
        className={cn(
          "relative flex items-center h-[68px] w-full border-b border-[var(--sidebar-border)]",
          expanded ? "px-4" : "justify-center px-2",
        )}
        aria-label="Profytron Home"
      >
        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BrandLogo size="md" showWordmark />
            </motion.div>
          ) : (
            <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <BrandLogo size="md" showWordmark={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      {/* Navigation groups */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className={cn("space-y-5", !expanded && "space-y-3")}>
          {navGroups.map((group) => (
            <div key={group.id}>
              {expanded ? (
                <div className="px-3 mb-1.5 flex items-center gap-1.5">
                  <span className="text-[11px] leading-none select-none" aria-hidden>
                    {group.emoji}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                    {group.label}
                  </span>
                </div>
              ) : (
                <div className="mx-auto mb-1.5 h-px w-6 bg-[var(--sidebar-border)]" />
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isItemActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={!expanded ? item.name : undefined}
                      className={cn(
                        "dash-nav-link group/nav relative",
                        active && "dash-nav-link-active",
                        !expanded && "justify-center w-10 mx-auto",
                      )}
                    >
                      {active && (
                        <>
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-primary to-[var(--brand-crimson)]" />
                          <span className="absolute inset-0 rounded-[10px] bg-[color-mix(in_srgb,var(--primary)_9%,transparent)] pointer-events-none" />
                        </>
                      )}
                      <div
                        className={cn(
                          "relative flex items-center gap-2.5 w-full",
                          expanded ? "pl-3 pr-2" : "justify-center",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "shrink-0 transition-colors duration-150 w-[18px] h-[18px]",
                            active
                              ? "text-primary"
                              : "text-muted-foreground group-hover/nav:text-foreground",
                          )}
                        />
                        {expanded && (
                          <span className="truncate font-medium">{item.name}</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {showAdminLink && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center h-10 rounded-[10px] text-sm font-medium border border-destructive/20",
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
        </div>
      </nav>

      {/* Footer — profile shortcut */}
      <div className="p-2 border-t border-[var(--sidebar-border)] space-y-1 shrink-0">
        {user && (
          <button
            type="button"
            onClick={() => router.push("/settings/profile")}
            className={cn(
              "w-full flex items-center gap-2.5 p-2 rounded-[10px] transition-colors",
              "hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]",
              !expanded && "justify-center",
            )}
            title="Profile"
          >
            <UserAvatar name={user.fullName || "User"} size="sm" />
            {expanded && (
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.fullName || "User"}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {user.subscriptionTier || "FREE"}
                </p>
              </div>
            )}
          </button>
        )}

        {!mobile && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full h-9 rounded-[10px] border border-[var(--sidebar-border)] text-muted-foreground hover:text-foreground hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] hover:border-[color-mix(in_srgb,var(--primary)_20%,var(--sidebar-border))] transition-all duration-200 text-xs font-medium"
          >
            <ChevronLeft
              className={cn("w-4 h-4 transition-transform duration-300", !sidebarOpen && "rotate-180")}
            />
            {expanded && <span className="ml-1.5">Collapse</span>}
          </button>
        )}
      </div>
    </motion.aside>
  );
}

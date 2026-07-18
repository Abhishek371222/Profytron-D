"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronDown,
  Wallet,
  Network,
  Trophy,
  Server,
  ShoppingBag,
  CreditCard,
  Unplug,
  Shield,
  Settings,
  Target,
  LineChart,
  User,
  LogOut,
  Copy,
} from "lucide-react";
import { cn, isAdminUser } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/useUIStore";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    items: [{ name: "Overview", icon: LayoutDashboard, href: "/dashboard" }],
  },
  {
    id: "trading",
    label: "Trading",
    items: [
      { name: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
      { name: "Markets", icon: LineChart, href: "/markets" },
      { name: "My Bots", icon: Server, href: "/my-bots" },
      { name: "Get Bots", icon: Copy, href: "/get-bots" },
      { name: "Connected Accounts", icon: Unplug, href: "/connected-accounts" },
      { name: "Alpha Coach", icon: Target, href: "/alpha-coach" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [
      { name: "Wallet", icon: Wallet, href: "/wallet" },
      { name: "Subscription", icon: CreditCard, href: "/subscriptions" },
    ],
  },
  {
    id: "community",
    label: "Community",
    items: [
      { name: "Leaderboard", icon: Trophy, href: "/leaderboard" },
      { name: "Affiliate Program", icon: Network, href: "/affiliate" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [
      { name: "Preferences", icon: Settings, href: "/settings/profile" },
    ],
  },
];

function isItemActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/settings/profile") return pathname.startsWith("/settings");
  return pathname === href || pathname.startsWith(`${href}/`);
}

const TOUR_ANCHORS: Record<string, string> = {
  "/connected-accounts": "nav-connected-accounts",
  "/wallet": "nav-wallet",
  "/marketplace": "nav-marketplace",
  "/my-bots": "nav-my-bots",
  "/markets": "nav-markets",
  "/alpha-coach": "nav-alpha-coach",
  "/subscriptions": "nav-subscriptions",
  "/leaderboard": "nav-leaderboard",
  "/settings/profile": "nav-settings",
};

const TIER_STYLES: Record<string, string> = {
  FREE: "bg-muted/60 text-muted-foreground",
  BASIC: "bg-primary/10 text-primary",
  PRO: "bg-primary/15 text-primary",
  VIP: "bg-[color-mix(in_srgb,var(--secondary)_25%,transparent)] text-primary",
  PREMIUM: "bg-[color-mix(in_srgb,var(--secondary)_30%,transparent)] text-primary",
};

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { logout } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const { data: user } = useCurrentUser();
  const expanded = mobile ? true : sidebarOpen;
  const showAdminLink = isAdminUser(user);

  const displayName = user?.fullName || "User";
  const displayTier =
    user?.subscriptionTier ||
    user?.tier ||
    (typeof user?.role === "string" ? user.role.toUpperCase() : null) ||
    "FREE";
  const tierClass = TIER_STYLES[displayTier] ?? TIER_STYLES.FREE;

  const handleBrandClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (!expanded && !mobile) {
      toggleSidebar();
      return;
    }
    router.push("/");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <motion.aside
      initial={false}
      animate={{
        width: mobile
          ? "var(--sidebar-w)"
          : !mounted
            ? "var(--sidebar-w)"
            : sidebarOpen
              ? "var(--sidebar-w)"
              : "var(--sidebar-w-collapsed)",
      }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
      className={cn(
        "relative h-full flex flex-col shrink-0 z-40",
        mobile ? "min-h-[100dvh]" : "min-h-0",
      )}
      suppressHydrationWarning
    >
      <div className="sidebar-panel flex flex-col h-full min-h-0 overflow-hidden">
        { }
        <div className="sidebar-panel-header">
          <Link
            href="/"
            onClick={handleBrandClick}
            className={cn(
              "relative flex w-full items-center transition-colors duration-200",
              expanded
                ?
                  "min-h-[clamp(6.5rem,7.5vw,7.25rem)] py-1 px-[calc(var(--sidebar-pad)*0.65)] hover:opacity-90"
                :
                  "min-h-[clamp(4.25rem,5vw,4.75rem)] py-1 justify-center px-2 rounded-xl hover:bg-[color-mix(in_srgb,var(--muted)_45%,transparent)]",
            )}
            aria-label={expanded ? "Profytron Home" : "Expand sidebar"}
            title={expanded ? undefined : "Expand sidebar"}
          >
            <AnimatePresence mode="wait">
              {expanded ? (
                <motion.div
                  key="expanded"
                  className="flex flex-1 justify-center min-w-0"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <BrandLogo size="sidebar" />
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.2 }}
                >
                  <BrandLogo size="sidebarCollapsed" showWordmark={false} />
                </motion.div>
              )}
            </AnimatePresence>

            {expanded && !mobile && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSidebar();
                }}
                className="sidebar-collapse-inline shrink-0"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </Link>
        </div>

        { }
        <nav aria-label="Main navigation" className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-[calc(var(--sidebar-pad)*0.65)] py-3">
          <div className={cn("space-y-[clamp(1rem,1.2vw,1.25rem)]", !expanded && "space-y-2")}>
            {navGroups.map((group) => (
              <div key={group.id}>
                {expanded ? (
                  <p className="sidebar-section-label px-3 mb-2">{group.label}</p>
                ) : (
                  <div className="sidebar-section-divider" aria-hidden />
                )}

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isItemActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        data-tour={TOUR_ANCHORS[item.href]}
                        title={!expanded ? item.name : undefined}
                        aria-label={!expanded ? item.name : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "sidebar-nav-link group/nav",
                          active && "sidebar-nav-link-active",
                          !expanded && "sidebar-nav-link-collapsed",
                        )}
                      >
                        <item.icon className="sidebar-nav-icon" aria-hidden />
                        {expanded && (
                          <span className="sidebar-nav-label truncate">{item.name}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {showAdminLink && (
              <Link
                href="/admin"
                aria-label={!expanded ? "Admin" : undefined}
                aria-current={pathname?.startsWith("/admin") ? "page" : undefined}
                className={cn(
                  "sidebar-nav-link border border-destructive/20",
                  pathname?.startsWith("/admin")
                    ? "bg-destructive/10 text-destructive"
                    : "text-destructive/80 hover:bg-destructive/5",
                  !expanded && "sidebar-nav-link-collapsed",
                )}
              >
                <Shield className="sidebar-nav-icon" aria-hidden />
                {expanded && <span className="sidebar-nav-label">Admin</span>}
              </Link>
            )}
          </div>
        </nav>

        { }
        <div className="shrink-0 px-[calc(var(--sidebar-pad)*0.65)] py-[calc(var(--sidebar-pad)*0.75)] flex flex-col gap-2">
          {user && expanded && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="sidebar-profile-card group w-full text-left">
                  <UserAvatar name={displayName} size="md" className="ring-2 ring-primary/20 shrink-0" />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-[var(--nav-text)] font-semibold text-foreground truncate leading-tight">
                      {displayName}
                    </p>
                    <span
                      className={cn(
                        "inline-flex mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.14em]",
                        tierClass,
                      )}
                    >
                      {displayTier}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[calc(var(--sidebar-w)-1.5rem)] mb-2 rounded-[14px] border border-[var(--card-border)] bg-popover/95 backdrop-blur-xl p-1.5"
              >
                <DropdownMenuItem
                  onClick={() => router.push("/settings/profile")}
                  className="rounded-xl gap-2.5 cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/settings")}
                  className="rounded-xl gap-2.5 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-xl gap-2.5 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {user && !expanded && (
            <button
              type="button"
              onClick={() => router.push("/settings/profile")}
              className="sidebar-profile-avatar-only mx-auto"
              title={displayName}
            >
              <UserAvatar name={displayName} size="sm" className="ring-2 ring-primary/20" />
            </button>
          )}

          {!mobile && (
            <button
              type="button"
              onClick={toggleSidebar}
              className={cn(
                "sidebar-collapse-fab",
                !expanded && "sidebar-collapse-fab-collapsed",
              )}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <ChevronLeft
                className={cn(
                  "w-4 h-4 transition-transform duration-300",
                  !sidebarOpen && "rotate-180",
                )}
              />
              {expanded && <span className="text-xs font-medium tracking-wide">Collapse</span>}
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

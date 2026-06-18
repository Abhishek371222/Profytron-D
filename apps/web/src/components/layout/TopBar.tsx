"use client";

import React from "react";
import { Search, Command, Menu, ChevronDown, Settings, CreditCard, KeyRound, LogOut, User, Link2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useUIStore } from "@/lib/stores/useUIStore";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { NotificationDropdown } from "@/components/ui/NotificationDropdown";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const TIER_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  FREE:    { bg: "bg-muted/6",         text: "text-foreground/40",     dot: "bg-foreground/30"     },
  BASIC:   { bg: "bg-chart-5/[0.12]",      text: "text-chart-5",     dot: "bg-chart-5"     },
  PRO:     { bg: "bg-primary/[0.12]",    text: "text-primary",   dot: "bg-primary"   },
  VIP:     { bg: "bg-chart-2/[0.12]",    text: "text-chart-2",   dot: "bg-chart-2"   },
  PREMIUM: { bg: "bg-chart-4/[0.12]",     text: "text-chart-4",    dot: "bg-chart-4"    },
};

export function TopBar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { setCommandPaletteOpen, toggleSidebar, setDepositIntent } = useUIStore();
  const { data: currentUser } = useCurrentUser();
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const openDeposit = () => {
    setDepositIntent(true);
    router.push("/wallet");
  };

  const resolvedUser = mounted ? currentUser || user : null;

  const displayName = mounted
    ? resolvedUser?.fullName ||
      resolvedUser?.name ||
      resolvedUser?.email?.split("@")?.[0] ||
      "Operative"
    : "…";
  const displayTier = mounted
    ? resolvedUser?.subscriptionTier ||
      resolvedUser?.tier ||
      (typeof resolvedUser?.role === "string" ? resolvedUser.role.toUpperCase() : null) ||
      "FREE"
    : "FREE";
  const displayAvatar = mounted ? resolvedUser?.avatarUrl || resolvedUser?.avatar || null : null;

  const tierStyle = TIER_STYLES[displayTier] ?? TIER_STYLES.FREE;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header suppressHydrationWarning className="relative h-16 sm:h-[68px] w-full flex items-center justify-between px-3 sm:px-5 lg:px-6 z-30 gap-2 sm:gap-4">
      {/* Glass backdrop */}
      <div className="absolute inset-0 glass-navbar border-b border-[var(--card-border)]" />

      {/* Top hairline accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute right-24 -top-8 w-48 h-16 rounded-full bg-primary/[0.06] blur-2xl" />

      {/* ─── Left: Mobile menu + Search ─── */}
      <div className="relative z-10 flex items-center gap-2 sm:gap-3 flex-1 max-w-xl min-w-0">
        <button
          onClick={toggleSidebar}
          className="lg:hidden h-10 w-10 shrink-0 rounded-button border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-hover flex items-center justify-center"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>

        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className={cn(
            "relative w-full min-w-0 flex items-center gap-2.5 px-3.5 h-10 sm:h-[42px] rounded-xl transition-all duration-200 group overflow-hidden",
            searchFocused
              ? "bg-[color-mix(in_srgb,var(--primary)_6%,transparent)] border border-[color-mix(in_srgb,var(--primary)_30%,transparent)] shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_14%,transparent)] scale-[1.01]"
              : "bg-card border border-border hover:bg-muted hover:border-[color-mix(in_srgb,var(--primary)_15%,var(--border))]",
          )}
          onMouseEnter={() => setSearchFocused(true)}
          onMouseLeave={() => setSearchFocused(false)}
        >
          {/* Beam sweep */}
          <div className="pointer-events-none absolute inset-y-0 -inset-x-full w-1/2 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent skew-x-[-18deg] translate-x-[-200%] group-hover:translate-x-[400%] transition-transform duration-700" />

          <Search className={cn(
            "w-3.5 h-3.5 shrink-0 transition-colors duration-200",
            searchFocused ? "text-primary" : "text-foreground/25 group-hover:text-foreground/40",
          )} />
          <span className={cn(
            "text-caption sm:text-body-sm truncate transition-colors duration-200 font-medium",
            searchFocused ? "text-foreground/50" : "text-foreground/20 group-hover:text-foreground/30",
          )}>
            Search markets, strategies, or commands...
          </span>
          <div className="ml-auto flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md border border-border bg-muted text-caption font-mono text-muted-foreground">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* ─── Right: Quick actions + Notifications + User ─── */}
      <div className="relative z-10 flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Connect Broker */}
        <button
          onClick={() => router.push("/copy-trading")}
          title="Enable trading bot"
          aria-label="Enable trading bot"
          className="hidden sm:flex relative h-10 w-10 sm:h-[42px] sm:w-[42px] rounded-xl border border-border bg-card hover:bg-muted text-foreground/40 hover:text-foreground transition-all items-center justify-center outline-none"
        >
          <Link2 className="w-[18px] h-[18px]" />
        </button>

        {/* Add Funds / Deposit */}
        <button
          onClick={openDeposit}
          title="Add funds"
          aria-label="Add funds"
          className="relative h-10 w-10 sm:h-[42px] sm:w-[42px] rounded-xl border border-border bg-card hover:bg-muted text-foreground/40 hover:text-foreground transition-all flex items-center justify-center outline-none"
        >
          <Wallet className="w-[18px] h-[18px]" />
        </button>

        <ThemeToggle />

        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-2 sm:gap-2.5 h-10 sm:h-[42px] pl-1 pr-2 sm:pr-3 rounded-xl border border-border bg-card hover:bg-muted transition-all duration-200 outline-none">
              {/* Avatar with ring */}
              <div className="relative">
                <UserAvatar name={displayName} src={displayAvatar} size="md" className="border-2 border-transparent group-hover:border-primary/30 transition-colors" />
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-chart-3 border-2 border-card"
                  style={{ boxShadow: "0 0 6px rgba(52,211,153,0.7)" }}
                />
              </div>

              {/* Name + tier — desktop only */}
              <div className="hidden md:flex flex-col items-start leading-none">
                <span className="text-caption font-semibold text-foreground/80 group-hover:text-foreground transition-colors truncate max-w-[120px]">
                  {displayName}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-micro font-bold uppercase tracking-[0.18em]",
                    tierStyle.bg, tierStyle.text,
                  )}>
                    <span className={cn("w-1 h-1 rounded-full", tierStyle.dot)} />
                    {displayTier}
                  </span>
                </div>
              </div>

              <ChevronDown className="w-3 h-3 text-foreground/25 group-hover:text-foreground/50 transition-colors hidden md:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 bg-popover backdrop-blur-xl border border-border shadow-lg rounded-card p-1.5"
          >
            {/* User header */}
            <div className="px-3 py-2.5 mb-1">
              <p className="text-caption font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-micro text-foreground/30 truncate mt-0.5">{resolvedUser?.email || ''}</p>
            </div>
            <div className="h-px bg-muted/6 mx-1 mb-1" />

            <DropdownMenuItem
              onClick={() => router.push("/settings/profile")}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground/60 hover:text-foreground hover:bg-muted/5 cursor-pointer text-caption font-medium transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/settings/api-keys")}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground/60 hover:text-foreground hover:bg-muted/5 cursor-pointer text-caption font-medium transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              API Keys
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/settings/billing")}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground/60 hover:text-foreground hover:bg-muted/5 cursor-pointer text-caption font-medium transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Subscription
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground/60 hover:text-foreground hover:bg-muted/5 cursor-pointer text-caption font-medium transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </DropdownMenuItem>

            <div className="h-px bg-muted/6 mx-1 my-1" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-destructive/80 hover:text-destructive hover:bg-destructive/[0.06] cursor-pointer text-caption font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

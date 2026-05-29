"use client";

import React from "react";
import { Search, Command, Menu, ChevronDown, Settings, CreditCard, KeyRound, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useUIStore } from "@/lib/stores/useUIStore";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { NotificationDropdown } from "@/components/ui/NotificationDropdown";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const TIER_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  FREE:    { bg: "bg-white/[0.06]",         text: "text-white/40",     dot: "bg-white/30"     },
  BASIC:   { bg: "bg-cyan-500/[0.12]",      text: "text-cyan-400",     dot: "bg-cyan-400"     },
  PRO:     { bg: "bg-indigo-500/[0.12]",    text: "text-indigo-300",   dot: "bg-indigo-400"   },
  VIP:     { bg: "bg-violet-500/[0.12]",    text: "text-violet-300",   dot: "bg-violet-400"   },
  PREMIUM: { bg: "bg-amber-500/[0.12]",     text: "text-amber-300",    dot: "bg-amber-400"    },
};

export function TopBar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { setCommandPaletteOpen, toggleSidebar } = useUIStore();
  const { data: currentUser } = useCurrentUser();
  const [searchFocused, setSearchFocused] = React.useState(false);

  const resolvedUser = currentUser || user;

  const displayName =
    resolvedUser?.fullName ||
    resolvedUser?.name ||
    resolvedUser?.email?.split("@")?.[0] ||
    "Operative";
  const displayTier =
    resolvedUser?.subscriptionTier ||
    resolvedUser?.tier ||
    (typeof resolvedUser?.role === "string" ? resolvedUser.role.toUpperCase() : null) ||
    "FREE";
  const displayAvatar =
    resolvedUser?.avatarUrl ||
    resolvedUser?.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;

  const tierStyle = TIER_STYLES[displayTier] ?? TIER_STYLES.FREE;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="relative h-16 sm:h-[68px] w-full flex items-center justify-between px-3 sm:px-5 lg:px-6 z-30 gap-2 sm:gap-4">
      {/* Glass backdrop */}
      <div className="absolute inset-0 bg-[#09090f]/70 backdrop-blur-xl border-b border-white/[0.05]" />

      {/* Top hairline accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute right-24 -top-8 w-48 h-16 rounded-full bg-indigo-500/[0.06] blur-2xl" />

      {/* ─── Left: Mobile menu + Search ─── */}
      <div className="relative z-10 flex items-center gap-2 sm:gap-3 flex-1 max-w-xl min-w-0">
        <button
          onClick={toggleSidebar}
          className="lg:hidden h-10 w-10 shrink-0 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.12] text-white/50 hover:text-white transition-all flex items-center justify-center"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>

        <motion.button
          animate={searchFocused ? { scale: 1.01 } : { scale: 1 }}
          transition={{ duration: 0.15 }}
          onClick={() => setCommandPaletteOpen(true)}
          className={cn(
            "relative w-full min-w-0 flex items-center gap-2.5 px-3.5 h-10 sm:h-[42px] rounded-xl transition-all duration-200 group overflow-hidden",
            searchFocused
              ? "bg-indigo-500/[0.06] border border-indigo-400/30 shadow-[0_0_20px_rgba(99,102,241,0.12)]"
              : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.10]",
          )}
          onMouseEnter={() => setSearchFocused(true)}
          onMouseLeave={() => setSearchFocused(false)}
        >
          {/* Beam sweep */}
          <div className="pointer-events-none absolute inset-y-0 -inset-x-full w-1/2 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent skew-x-[-18deg] translate-x-[-200%] group-hover:translate-x-[400%] transition-transform duration-700" />

          <Search className={cn(
            "w-3.5 h-3.5 shrink-0 transition-colors duration-200",
            searchFocused ? "text-indigo-400" : "text-white/25 group-hover:text-white/40",
          )} />
          <span className={cn(
            "text-[12px] sm:text-[13px] truncate transition-colors duration-200 font-medium",
            searchFocused ? "text-white/50" : "text-white/20 group-hover:text-white/30",
          )}>
            Search markets, strategies, or commands...
          </span>
          <div className="ml-auto flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md border border-white/[0.07] bg-white/[0.03] text-[10px] font-mono text-white/25">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </motion.button>
      </div>

      {/* ─── Right: Notifications + User ─── */}
      <div className="relative z-10 flex items-center gap-2 sm:gap-3 shrink-0">
        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-2 sm:gap-2.5 h-10 sm:h-[42px] pl-1 pr-2 sm:pr-3 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.10] transition-all duration-200 outline-none">
              {/* Avatar with ring */}
              <div className="relative">
                <Avatar className="h-8 w-8 border-2 border-transparent group-hover:border-indigo-400/30 transition-colors duration-200">
                  <AvatarImage src={displayAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-500/40 to-indigo-500/40 text-white text-xs font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Online dot */}
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#09090f]"
                  style={{ boxShadow: "0 0 6px rgba(52,211,153,0.7)" }}
                />
              </div>

              {/* Name + tier — desktop only */}
              <div className="hidden md:flex flex-col items-start leading-none">
                <span className="text-[12px] font-semibold text-white/80 group-hover:text-white transition-colors truncate max-w-[120px]">
                  {displayName}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-[0.18em]",
                    tierStyle.bg, tierStyle.text,
                  )}>
                    <span className={cn("w-1 h-1 rounded-full", tierStyle.dot)} />
                    {displayTier}
                  </span>
                </div>
              </div>

              <ChevronDown className="w-3 h-3 text-white/25 group-hover:text-white/50 transition-colors hidden md:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 bg-[#0d0d18]/95 backdrop-blur-xl border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.6)] rounded-2xl p-1.5"
          >
            {/* User header */}
            <div className="px-3 py-2.5 mb-1">
              <p className="text-[12px] font-semibold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-white/30 truncate mt-0.5">{resolvedUser?.email || ''}</p>
            </div>
            <div className="h-px bg-white/[0.06] mx-1 mb-1" />

            <DropdownMenuItem
              onClick={() => router.push("/settings/profile")}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.05] cursor-pointer text-[12px] font-medium transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/settings/api-keys")}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.05] cursor-pointer text-[12px] font-medium transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              API Keys
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/settings/billing")}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.05] cursor-pointer text-[12px] font-medium transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Subscription
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.05] cursor-pointer text-[12px] font-medium transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </DropdownMenuItem>

            <div className="h-px bg-white/[0.06] mx-1 my-1" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/[0.06] cursor-pointer text-[12px] font-medium transition-colors"
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

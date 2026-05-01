"use client";

import React from"react";
import { Search, ChevronDown, Command, Menu } from"lucide-react";
import { useRouter } from "next/navigation";
import { 
 DropdownMenu, 
 DropdownMenuContent, 
 DropdownMenuItem, 
 DropdownMenuLabel, 
 DropdownMenuSeparator, 
 DropdownMenuTrigger 
} from"@/components/ui/dropdown-menu";
import { Button } from"@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from"@/components/ui/avatar";
import { useAuthStore } from"@/lib/stores/useAuthStore";
import { useUIStore } from"@/lib/stores/useUIStore";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';

export function TopBar() {
 const router = useRouter();
 const { user, logout } = useAuthStore();
 const { setCommandPaletteOpen, toggleSidebar } = useUIStore();
  const { data: currentUser } = useCurrentUser();

 const resolvedUser = currentUser || user;

 const displayName =
   resolvedUser?.fullName ||
   resolvedUser?.name ||
   resolvedUser?.email?.split('@')?.[0] ||
   'Operative';
 const displayTier =
   resolvedUser?.subscriptionTier ||
   resolvedUser?.tier ||
   (typeof resolvedUser?.role === 'string' ? resolvedUser.role.toUpperCase() : null) ||
   'FREE';
 const displayAvatar =
   resolvedUser?.avatarUrl ||
   resolvedUser?.avatar ||
   'https://api.dicebear.com/7.x/avataaars/svg?seed=Operative';

 const handleLogout = async () => {
   await logout();
   router.push('/login');
 };

 const handleNavigate = (path: string) => {
   router.push(path);
 };

 return (
 <header className="h-16 sm:h-20 w-full glass border-b border-border-default flex items-center justify-between px-3 sm:px-4 lg:px-6 sticky top-0 z-30 gap-2 sm:gap-4">
 {/* Search / Command Launcher */}
 <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl min-w-0">
 <Button
 onClick={toggleSidebar}
 variant="ghost"
 size="icon"
 className="lg:hidden h-10 w-10 shrink-0 rounded-xl border border-border-faint bg-white/5 hover:bg-white/10"
 aria-label="Toggle sidebar"
 >
 <Menu className="w-5 h-5" />
 </Button>
 <button 
 onClick={() => setCommandPaletteOpen(true)}
 className="w-full min-w-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 h-10 sm:h-11 rounded-xl bg-white/5 border border-border-faint text-slate-400 hover:bg-white/10 hover:border-border-subtle transition-all group"
 >
 <Search className="w-4 h-4 shrink-0 group-hover:text-p transition-colors" />
 <span className="text-xs sm:text-sm truncate">Search markets, strategies, or commands...</span>
 <div className="ml-auto flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-xs font-mono">
 <Command className="w-3 h-3" /> K
 </div>
 </button>
 </div>

  {/* Live ticker removed per design request; real-time market values shown elsewhere */}

 {/* Actions */}
 <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
 <NotificationDropdown />

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-10 sm:h-12 gap-2 sm:gap-3 pl-1.5 sm:pl-2 pr-2 sm:pr-4 rounded-full bg-white/5 hover:bg-white/10 border border-border-faint transition-all">
 <Avatar className="h-8 w-8 border border-p/20">
 <AvatarImage src={displayAvatar} />
 <AvatarFallback>AV</AvatarFallback>
 </Avatar>
 <div className="hidden md:flex flex-col items-start">
 <span className="text-xs font-semibold leading-tight">{displayName}</span>
 <span className="text-xs text-p uppercase tracking-tight font-bold">{displayTier}</span>
 </div>
 <ChevronDown className="w-4 h-4 text-slate-500" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-56 glass-strong">
 <DropdownMenuLabel>My Account</DropdownMenuLabel>
 <DropdownMenuSeparator />
 <DropdownMenuItem onClick={() => handleNavigate('/settings/profile')} className="cursor-pointer">
   Profile Settings
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleNavigate('/settings/api-keys')} className="cursor-pointer">
   API Keys
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleNavigate('/settings/billing')} className="cursor-pointer">
   Subscription
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem onClick={handleLogout} className="text-danger hover:bg-danger/10 hover:text-danger cursor-pointer">
   Log Out
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </header>
 );
}

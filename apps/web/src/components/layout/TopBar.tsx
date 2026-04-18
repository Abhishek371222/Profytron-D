"use client";

import React from"react";
import { Search, ChevronDown, Command } from"lucide-react";
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
 const { setCommandPaletteOpen } = useUIStore();
 const { data: currentUser } = useCurrentUser();
 const tickerItems = [
   { symbol: 'BTC', price: '65,120.45', change: '2.4%', positive: true },
   { symbol: 'ETH', price: '3,410.20', change: '0.8%', positive: false },
   { symbol: 'SOL', price: '145.60', change: '5.2%', positive: true },
 ];

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
 <header className="h-20 w-full glass border-b border-border-default flex items-center justify-between px-8 sticky top-0 z-30">
 {/* Search / Command Launcher */}
 <div className="flex-1 max-w-xl">
 <button 
 onClick={() => setCommandPaletteOpen(true)}
 className="w-full flex items-center gap-3 px-4 h-11 rounded-xl bg-white/5 border border-border-faint text-slate-400 hover:bg-white/10 hover:border-border-subtle transition-all group"
 >
 <Search className="w-4 h-4 group-hover:text-p transition-colors" />
 <span className="text-sm">Search markets, strategies, or commands...</span>
 <div className="ml-auto flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-xs font-mono">
 <Command className="w-3 h-3" /> K
 </div>
 </button>
 </div>

 {/* Ticker Placeholder (Will be animated in simulator step) */}
 <div className="hidden lg:flex items-center gap-8 mx-8 overflow-hidden flex-1 justify-center">
 <div className="flex items-center gap-2 whitespace-nowrap">
 <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Live Ticker</span>
 <div className="flex gap-4 animate-ticker">
 {tickerItems.map((item, index) => (
   <span key={item.symbol} className="text-xs font-mono inline-flex items-center gap-1.5">
     <span className="text-p">{item.symbol}</span>
     <span>{item.price}</span>
     <span className={item.positive ? 'text-success' : 'text-danger'}>{item.change}</span>
     {index < tickerItems.length - 1 ? <span className="text-white/25">•</span> : null}
   </span>
 ))}
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-4">
 <NotificationDropdown />

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-12 gap-3 pl-2 pr-4 rounded-full bg-white/5 hover:bg-white/10 border border-border-faint transition-all">
 <Avatar className="h-8 w-8 border border-p/20">
 <AvatarImage src={displayAvatar} />
 <AvatarFallback>AV</AvatarFallback>
 </Avatar>
 <div className="flex flex-col items-start">
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

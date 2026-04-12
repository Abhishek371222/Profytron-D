"use client";

import React from"react";
import { Search, Bell, User, ChevronDown, Command } from"lucide-react";
import { cn } from"@/lib/utils";
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

export function TopBar() {
 const { user } = useAuthStore();
 const { setCommandPaletteOpen } = useUIStore();

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
 <span className="text-xs font-mono"><span className="text-p">BTC</span> 65,120.45 <span className="text-success">+2.4%</span></span>
 <span className="text-xs font-mono"><span className="text-p">ETH</span> 3,410.20 <span className="text-danger">-0.8%</span></span>
 <span className="text-xs font-mono"><span className="text-p">SOL</span> 145.60 <span className="text-success">+5.2%</span></span>
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-4">
 <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white rounded-full">
 <Bell className="w-5 h-5" />
 <span className="absolute top-2 right-2 w-2 h-2 bg-p rounded-full border-2 border-bg-base" />
 </Button>

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-12 gap-3 pl-2 pr-4 rounded-full bg-white/5 hover:bg-white/10 border border-border-faint transition-all">
 <Avatar className="h-8 w-8 border border-p/20">
 <AvatarImage src={user?.avatar ||"https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} />
 <AvatarFallback>AV</AvatarFallback>
 </Avatar>
 <div className="flex flex-col items-start">
 <span className="text-xs font-semibold leading-tight">{user?.name ||"Alexander Voss"}</span>
 <span className="text-xs text-p uppercase tracking-tight font-bold">{user?.tier ||"Institutional"}</span>
 </div>
 <ChevronDown className="w-4 h-4 text-slate-500" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-56 glass-strong">
 <DropdownMenuLabel>My Account</DropdownMenuLabel>
 <DropdownMenuSeparator />
 <DropdownMenuItem>Profile Settings</DropdownMenuItem>
 <DropdownMenuItem>API Keys</DropdownMenuItem>
 <DropdownMenuItem>Subscription</DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem className="text-danger hover:bg-danger/10 hover:text-danger">Log Out</DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </header>
 );
}

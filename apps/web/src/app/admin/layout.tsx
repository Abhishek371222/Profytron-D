"use client";

import React, { useEffect, useState } from"react";
import Link from"next/link";
import { usePathname, useRouter } from"next/navigation";
import { useAuthStore } from"@/lib/stores/useAuthStore";
import { motion, AnimatePresence } from"framer-motion";
import { cn } from"@/lib/utils";
import {
 LayoutDashboard,
 ShieldCheck,
 LogOut,
 ChevronLeft,
 AlertTriangle,
 BarChart3
} from"@/components/ui/icons";

// We need to extend the icons or use existing ones that match.
// I'll import from lucide-react for the ones not in ui/icons if needed, or stick to what is available.
import { Users as UsersIcon, Shield as ShieldIcon, Server as ServerIcon } from"lucide-react";

const adminNavItems = [
 { name:"Dashboard", icon: LayoutDashboard, href:"/admin" },
 { name:"Users", icon: UsersIcon, href:"/admin/users" },
 { name:"Strategies", icon: ShieldIcon, href:"/admin/strategies" },
 { name:"System", icon: ServerIcon, href:"/admin/system" },
];

function AdminSidebar() {
 const pathname = usePathname();
 const [sidebarOpen, setSidebarOpen] = useState(true);
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
 setMounted(true);
 }, []);

 return (
 <motion.aside
 initial={false}
 animate={{ width: !mounted ? 220 : (sidebarOpen ? 220 : 80) }}
 className={cn(
"relative h-screen flex flex-col bg-slate-950 border-r border-red-900/30 z-40 transition-all duration-300",
 (!mounted || !sidebarOpen) &&"items-center"
 )}
 suppressHydrationWarning
 >
 {/* Logo */}
 <div className="flex items-center justify-between h-20 px-6 border-b border-red-900/20">
 <AnimatePresence>
 {sidebarOpen && (
 <motion.div
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -10 }}
 className="flex items-center gap-2"
 >
 <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
 <ShieldCheck className="text-white w-5 h-5" />
 </div>
 <span className="font-display font-bold space-x-1 tracking-tight text-red-500">
 ADMIN
 </span>
 </motion.div>
 )}
 </AnimatePresence>
 
 {(!sidebarOpen) && (
 <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
 <ShieldCheck className="text-red-500 w-5 h-5" />
 </div>
 )}
 </div>

 {/* Navigation */}
 <nav className="flex-1 px-3 space-y-2 py-6">
 {adminNavItems.map((item) => {
 const isActive = pathname === item.href;
 return (
 <Link
 key={item.href}
 href={item.href}
 className={cn(
"flex items-center h-11 rounded-lg transition-all relative group",
 isActive 
 ?"bg-red-500/10 text-red-400 font-medium shadow-[0_0_20px_rgba(239,68,68,0.05)] border border-red-500/20" 
 :"text-slate-400 hover:text-slate-200 hover:bg-slate-800",
 !sidebarOpen &&"justify-center"
 )}
 >
 <div className={cn("flex items-center gap-3", sidebarOpen ?"px-4" :"px-0")}>
 <item.icon className={cn("w-5 h-5 transition-transform", !isActive &&"group-hover:scale-110")} />
 {sidebarOpen && <span>{item.name}</span>}
 </div>
 
 {isActive && (
 <motion.div
 layoutId="admin-active-indicator"
 className="absolute left-0 w-1 h-6 bg-red-500 rounded-r-full"
 />
 )}
 
 {!sidebarOpen && (
 <div className="absolute left-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
 {item.name}
 </div>
 )}
 </Link>
 );
 })}
 </nav>

 {/* Footer / Settings */}
 <div className="p-4 space-y-2 border-t border-red-900/20">
 <Link
 href="/dashboard"
 className={cn(
"flex items-center h-11 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all group",
 !sidebarOpen &&"justify-center"
 )}
 >
 <div className={cn("flex items-center gap-3", sidebarOpen ?"px-4" :"px-0")}>
 <LogOut className="w-5 h-5" />
 {sidebarOpen && <span>Exit Admin</span>}
 </div>
 </Link>
 
 <button
 onClick={() => setSidebarOpen(!sidebarOpen)}
 className="flex items-center justify-center w-full h-10 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors"
 >
 {sidebarOpen ? <ChevronLeft className="w-4 h-4 text-slate-400" /> : <ChevronLeft className="w-4 h-4 text-slate-400 rotate-180" />}
 </button>
 </div>
 </motion.aside>
 );
}


export default function AdminLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const { user, isAuthenticated, isLoading } = useAuthStore();
 const router = useRouter();

 useEffect(() => {
 if (!isLoading && isAuthenticated && user?.role !== 'ADMIN') {
 router.push('/dashboard');
 }
 }, [isAuthenticated, isLoading, user, router]);

 if (isLoading || !isAuthenticated || user?.role !== 'ADMIN') {
 return (
 <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-slate-400">
 Authenticating...
 </div>
 );
 }

 return (
 <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
 <AdminSidebar />
 <div className="flex-1 flex flex-col h-screen overflow-hidden">
 <div className="h-10 bg-red-600/10 border-b border-red-500/20 flex items-center justify-center gap-2 text-red-500 text-sm font-medium px-4">
 <AlertTriangle className="w-4 h-4" />
 <span>ADMIN MODE — Actions here affect all users</span>
 </div>
 <main className="flex-1 overflow-y-auto w-full max-w-full">
 {children}
 </main>
 </div>
 </div>
 );
}

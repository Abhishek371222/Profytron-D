'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  User, 
  Shield, 
  Bell, 
  Zap, 
  CreditCard, 
  Key,
  ChevronRight,
  Settings,
  Cpu
} from '@/components/ui/icons';
import { Magnetic } from '@/components/ui/Interactions';

const navItems = [
  { name: 'Profile Identity', icon: User, href: '/settings/profile', desc: 'BIOMETRICS & CORE DATA' },
  { name: 'Quantum Security', icon: Shield, href: '/settings/security', desc: 'ENCRYPTION & ACCESS' },
  { name: 'Neural Alerts', icon: Bell, href: '/settings/notifications', desc: 'REAL-TIME SIGNALING' },
  { name: 'Execution Engine', icon: Zap, href: '/settings/trading', desc: 'ALGORITHMIC PARAMETERS' },
  { name: 'Treasury & Tiers', icon: CreditCard, href: '/settings/billing', desc: 'LIQUIDITY & SUBSCRIPTIONS' },
  { name: 'Interface API', icon: Key, href: '/settings/api-keys', desc: 'NEURAL HANDSHAKES' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-10 pb-20">
      {/* Settings Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
           <Settings className="w-4 h-4 text-primary animate-spin-slow" />
           <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">Central Command</span>
        </div>
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">System Config</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-16 items-start">
        {/* FLUID NAVIGATION SIDEBAR */}
        <div className="w-full lg:w-[340px] shrink-0 space-y-3">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <Magnetic key={item.href} strength={0.1}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-6 p-6 rounded-[28px] transition-all relative group overflow-hidden border",
                    isActive 
                      ? "glass-ultra border-primary/20 shadow-[0_0_40px_rgba(99,102,241,0.15)] bg-primary/5" 
                      : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                  )}
                >
                  <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                      isActive ? "bg-primary text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]" : "bg-white/5 text-white/10 group-hover:text-white/30"
                  )}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col flex-1">
                     <span className={cn(
                         "text-[14px] font-black uppercase tracking-wider transition-colors italic",
                         isActive ? "text-white" : "text-white/30 group-hover:text-white/50"
                     )}>{item.name}</span>
                     <span className="text-[9px] font-bold text-white/10 uppercase tracking-[0.2em] mt-1">
                       {item.desc}
                     </span>
                  </div>
                  
                  {isActive && (
                      <motion.div 
                        layoutId="activeDot"
                        className="absolute right-6 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(99,102,241,1)]"
                      />
                  )}
                  
                  {/* Scanline effect on hover/active */}
                  {(isActive || pathname === item.href) && (
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] animate-scanline bg-gradient-to-b from-transparent via-white to-transparent h-[200%]" />
                  )}
                </Link>
              </Magnetic>
            );
          })}
          
          {/* System Health Module (Sidebar Bottom) */}
          <div className="mt-8 p-6 rounded-[28px] border border-white/5 bg-white/[0.01] space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Interface Stability</span>
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Nominal</span>
             </div>
             <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '98%' }}
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                />
             </div>
             <div className="flex items-center gap-3">
                <Cpu className="w-3 h-3 text-white/20" />
                <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.2em]">Quantum Core v4.28-Stable</span>
             </div>
          </div>
        </div>

        {/* PREMIUM CONTENT AREA */}
        <div className="flex-1 w-full relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/10 via-transparent to-indigo-500/10 rounded-[42px] blur-2xl opacity-50 group-hover:opacity-70 transition-opacity" />
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 15, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="bg-bg-base/40 glass-ultra border border-white/5 rounded-[40px] p-12 shadow-2xl relative z-10 min-h-[600px]"
            >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -mr-20 -mt-20 -z-10" />
                
                {children}
            </motion.div>
        </div>
      </div>
    </div>
  );
}

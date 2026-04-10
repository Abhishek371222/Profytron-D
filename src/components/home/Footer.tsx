'use client';

import Link from 'next/link';
import { Zap, Globe, Code, Activity, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const footerLinks = {
  Product: [
    { name: 'Features', href: '#features' },
    { name: 'Strategy Library', href: '/strategies' },
    { name: 'Visual Builder', href: '/strategies/builder' },
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'Security Protocol', href: '/settings/security' },
  ],
  Company: [
    { name: 'About Us', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Press Kit', href: '#' },
  ],
  Resources: [
    { name: 'Documentation', href: '#' },
    { name: 'API Reference', href: '#' },
    { name: 'Market Guides', href: '#' },
    { name: 'Community', href: '#' },
  ],
  Legal: [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Risk Disclosure', href: '#' },
    { name: 'Cookie Policy', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="pt-40 pb-16 bg-black border-t border-white/5 relative overflow-hidden">
      {/* Background Architectural Glow */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-p/50 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-p/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24 mb-32">
          {/* Logo & Foundation */}
          <div className="lg:col-span-5">
            <Link href="/" className="flex items-center gap-4 mb-12 group">
              <div className="w-14 h-14 bg-p/10 rounded-2xl flex items-center justify-center border border-p/20 group-hover:bg-p/20 transition-all duration-700 shadow-[0_0_30px_rgba(99,102,241,0.2)] group-hover:rotate-[15deg]">
                <Zap className="w-8 h-8 text-p fill-p animate-pulse" />
              </div>
              <span className="text-4xl font-syne font-black tracking-tighter text-white italic group-hover:text-p transition-colors uppercase">
                PROFY<span className="text-p group-hover:text-white transition-colors duration-700">TRON</span>
              </span>
            </Link>
            <p className="text-white/40 text-2xl mb-16 leading-relaxed max-w-md font-syne font-medium italic tracking-tight">
              Architecting the future of algorithmic wealth. Institutional power, refined for the frontier of finance.
            </p>
            <div className="flex gap-6">
              {[Globe, Code, Activity, Mail].map((Icon, i) => (
                <Link 
                  key={i} 
                  href="#" 
                  className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/20 hover:text-p hover:border-p/40 hover:bg-p/5 transition-all duration-500 hover:-translate-y-2 shadow-2xl group"
                >
                  <Icon className="w-7 h-7 group-hover:scale-110 transition-transform" />
                </Link>
              ))}
            </div>
          </div>

          {/* Institutional Navigation */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-12">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title} className="flex flex-col gap-8">
                <h6 className="font-black text-white text-[10px] uppercase tracking-[0.5em] font-syne opacity-30 italic">{title}</h6>
                <ul className="flex flex-col gap-6">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="text-white/40 hover:text-white transition-all duration-300 text-sm font-bold tracking-tight inline-flex items-center group/link font-syne uppercase italic">
                        <div className="w-0 h-px bg-p group-hover/link:w-4 transition-all duration-500 mr-0 group-hover/link:mr-3" />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Global Matrix Status Bar */}
        <div className="pt-16 border-t border-white/5 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-12">
          <div className="max-w-4xl flex flex-col gap-6">
            <div className="flex items-center gap-6">
               <p className="text-[10px] text-p font-black uppercase tracking-[0.5em] font-syne italic">
                 © 2026 PROFYTRON_TECHNOLOGIES_CORP
               </p>
               <div className="h-px w-20 bg-white/5" />
               <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] font-syne italic">
                 AUTH_NODES: STABLE
               </p>
            </div>
            <p className="text-[9px] text-white/10 leading-relaxed font-syne tracking-widest uppercase italic">
              Risk Disclosure: Digital asset trading involves substantial risk of loss and is not suitable for all investors. 
              The performance of algorithmic strategies is inherently speculative. Synchronize responsible leverage metrics.
            </p>
          </div>
          
          <div className="flex items-center gap-8 shrink-0">
            <div className="flex items-center gap-4 py-3 px-6 rounded-2xl border border-p/20 bg-p/5 backdrop-blur-3xl shadow-[0_0_20px_rgba(99,102,241,0.1)]">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-p animate-pulse" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-p animate-ping opacity-40" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-p font-syne italic">Global_Grid_Synchronized</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

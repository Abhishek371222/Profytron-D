'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, Zap, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  {
    name: 'Company',
    children: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Blog', href: '/blog' },
    ],
  },
  {
    name: 'Resources',
    children: [
      { name: 'Documentation', href: '/docs' },
      { name: 'API Reference', href: '/api-reference' },
      { name: 'Market Guides', href: '/guides' },
      { name: 'Community', href: '/community' },
    ],
  },
  {
    name: 'Legal',
    children: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Risk Disclosure', href: '/risk-disclosure' },
      { name: 'Cookie Policy', href: '/cookies' },
    ],
  },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const handler = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, [mounted]);

  return (
    <nav
      className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-500', isScrolled ? 'py-3' : 'py-6')}
      role="navigation"
      aria-label="Site navigation"
    >
      <div className="container mx-auto px-6">
        <div className={cn(
          'flex items-center justify-between transition-all duration-500 px-6 py-3 rounded-3xl border border-transparent w-full',
          isScrolled && mounted
            ? 'bg-black/70 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border-white/10'
            : 'bg-transparent'
        )}>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" aria-label="Profytron Home">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-all duration-300 shadow-[0_0_16px_rgba(99,102,241,0.2)]">
              <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
              PROFY<span className="text-indigo-400 group-hover:text-white transition-colors duration-300">TRON</span>
            </span>
          </Link>

          {/* Desktop nav — dropdown groups */}
          <div className="hidden lg:flex items-center gap-1 bg-white/3 border border-white/6 py-2 px-4 rounded-full backdrop-blur-xl">
            {/* Home link */}
            <Link
              href="/"
              className="px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/5"
            >
              Home
            </Link>

            {navLinks.map((group) => {
              const isActive = group.children.some(c => c.href === pathname);
              return (
                <div key={group.name} className="relative"
                  onMouseEnter={() => setOpenDropdown(group.name)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button className={cn(
                    'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[0.18em] transition-all',
                    isActive
                      ? 'text-indigo-300 bg-indigo-500/10'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  )}>
                    {group.name}
                    <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', openDropdown === group.name && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {openDropdown === group.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 w-48 py-2 rounded-xl bg-[#0d0d14] border border-white/8 shadow-2xl"
                      >
                        {group.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'block px-4 py-2.5 text-sm transition-colors',
                              pathname === child.href
                                ? 'text-indigo-300 bg-indigo-500/10'
                                : 'text-white/50 hover:text-white hover:bg-white/4'
                            )}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40 hover:text-white hover:bg-white/5 h-10">
                Client Portal
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 h-10 rounded-xl uppercase tracking-widest shadow-[0_0_24px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all flex items-center gap-2">
                Open Terminal <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden w-10 h-10 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="absolute top-[80px] left-4 right-4 bg-[#0d0d14]/95 backdrop-blur-xl rounded-2xl border border-white/8 p-6 lg:hidden shadow-2xl"
          >
            <Link href="/" className="block text-sm font-semibold text-white/50 hover:text-white py-2 mb-2 border-b border-white/6">
              ← Back to Home
            </Link>
            {navLinks.map((group) => (
              <div key={group.name} className="mb-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25 mb-2 px-1">{group.name}</div>
                {group.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'block px-3 py-2 rounded-lg text-sm transition-colors',
                      pathname === child.href ? 'text-indigo-300 bg-indigo-500/10' : 'text-white/50 hover:text-white hover:bg-white/4'
                    )}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-white/6">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full h-11 text-xs font-bold uppercase tracking-widest border-white/8 bg-white/3 text-white">
                  Client Portal
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button className="w-full h-11 text-xs font-bold uppercase tracking-widest bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                  Open Terminal
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

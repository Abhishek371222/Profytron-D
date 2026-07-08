'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/brand/BrandLogo';

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;
    const handler = () => setIsScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, [mounted]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        isScrolled ? 'py-2' : 'py-4 sm:py-5',
      )}
      role="banner"
    >
      <div className="page-container max-w-7xl">
        <nav
          className={cn(
            'flex items-center justify-between px-4 sm:px-5 py-2.5 rounded-button border transition-all duration-300',
            isScrolled && mounted
              ? 'glass-navbar shadow-sm border-[var(--card-border)]'
              : 'border-transparent bg-transparent',
          )}
          aria-label="Site navigation"
        >
          <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="Profytron Home">
            <BrandLogo size="md" showWordmark />
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                pathname === '/'
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              Home
            </Link>

            {navLinks.map((group) => {
              const isActive = group.children.some((c) => c.href === pathname);
              return (
                <div
                  key={group.name}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(group.name)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    type="button"
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    {group.name}
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 opacity-60 transition-transform duration-200',
                        openDropdown === group.name && 'rotate-180',
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {openDropdown === group.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 w-52 py-2 rounded-card bg-card border border-border shadow-[var(--shadow-lg)]"
                      >
                        {group.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'block px-4 py-2.5 text-sm transition-colors',
                              pathname === child.href
                                ? 'text-primary bg-primary/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
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

          <div className="hidden md:flex items-center gap-2.5">
            <ThemeToggle size="sm" />
            <Link href="/login">
              <Button
                variant="ghost"
                className="font-medium text-sm text-muted-foreground hover:text-foreground h-10"
              >
                Client Portal
              </Button>
            </Link>
            <Link href="/register">
              <Button className="h-10 px-5 text-sm font-semibold rounded-button bg-primary text-primary-foreground hover:brightness-110 shadow-[var(--shadow-cta)] gap-2">
                Open Terminal
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <button
            type="button"
            className="lg:hidden w-10 h-10 rounded-[10px] border border-[var(--card-border)] bg-card flex items-center justify-center text-muted-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="absolute top-[72px] left-4 right-4 sm:left-6 sm:right-6 bg-card rounded-card border border-border p-6 lg:hidden shadow-[var(--shadow-lg)] max-h-[calc(100dvh-90px)] overflow-y-auto"
          >
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-semibold text-muted-foreground hover:text-foreground py-2 mb-2 border-b border-border"
            >
              ← Back to Home
            </Link>
            {navLinks.map((group) => (
              <div key={group.name} className="mb-4">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
                  {group.name}
                </div>
                {group.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'block px-3 py-2 rounded-lg text-sm transition-colors',
                      pathname === child.href
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle size="sm" />
              </div>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full h-11 rounded-button">
                  Client Portal
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button className="w-full h-11 rounded-button bg-primary text-primary-foreground font-semibold">
                  Open Terminal
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

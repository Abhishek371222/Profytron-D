'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, Zap, ChevronDown, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { LandingDashboardLink, LandingPrimaryLink } from '@/components/home/LandingButtons';

const navLinks = [
  { name: 'Product', href: '#features' },
  { name: 'Capabilities', href: '#features' },
  { name: 'Solutions', href: '#how-it-works' },
  { name: 'Resources', href: '/docs' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Company', href: '/about' },
];

function scrollToHash(href: string) {
  if (!href.startsWith('#')) {
    window.location.href = href;
    return;
  }
  const id = href.replace('#', '');
  const el = document.getElementById(id);
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

function AuthActions({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { isAuthenticated, user, isHydrating } = useAuthStore();
  const displayName =
    user?.fullName || user?.name || user?.email?.split('@')?.[0] || 'Account';

  if (isHydrating) {
    return (
      <div className={cn('flex items-center gap-2', mobile && 'w-full')}>
        <div className={cn('h-10 rounded-[14px] bg-muted/40 animate-pulse', mobile ? 'w-full' : 'w-28')} />
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (mobile) {
      return (
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-3 px-1 py-1">
            <UserAvatar name={displayName} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Link href="/dashboard" onClick={onNavigate} className="w-full">
            <Button className="w-full h-11 rounded-[14px] bg-primary text-primary-foreground font-semibold gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Open Dashboard
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <>
        <Link
          href="/dashboard"
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-muted/60 transition-colors min-w-0 max-w-[180px]"
        >
          <UserAvatar name={displayName} size="sm" />
          <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
        </Link>
        <LandingDashboardLink className="h-10 px-5 text-sm" />
      </>
    );
  }

  if (mobile) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <Link href="/login" onClick={onNavigate} className="w-full">
          <Button variant="outline" className="w-full h-11 rounded-[14px]">
            Sign In
          </Button>
        </Link>
        <Link href="/register" onClick={onNavigate} className="w-full">
          <Button className="w-full h-11 rounded-[14px] bg-primary text-primary-foreground font-semibold">
            Get Started
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link href="/login">
        <Button variant="ghost" className="font-medium text-sm text-muted-foreground hover:text-foreground h-10">
          Sign In
        </Button>
      </Link>
      <LandingPrimaryLink href="/register" className="h-10 px-5 text-sm">
        Get Started
        <ArrowRight className="w-4 h-4 shrink-0" />
      </LandingPrimaryLink>
    </>
  );
}

export function LandingNavbar() {
  const { isHydrating } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  const homeHref = '/';

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'py-2' : 'py-4 sm:py-5',
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="page-container max-w-7xl">
        <div
          className={cn(
            'flex items-center justify-between px-4 sm:px-5 py-2.5 rounded-[14px] border transition-all duration-300',
            isScrolled && mounted
              ? 'glass-navbar shadow-sm border-[var(--card-border)]'
              : 'bg-transparent border-transparent',
          )}
        >
          <Link href={homeHref} className="flex items-center gap-2.5 group shrink-0" aria-label="Profytron Home">
            <div className="w-9 h-9 bg-primary/10 rounded-[10px] flex items-center justify-center border border-primary/15">
              <Zap className="w-4 h-4 text-primary fill-primary/20" aria-hidden />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              PROFY<span className="text-primary">TRON</span>
            </span>
          </Link>

          <div className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToHash(link.href);
                }}
                className="flex items-center gap-0.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
              >
                {link.name}
                {['Product', 'Solutions', 'Resources'].includes(link.name) && (
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                )}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2.5">
            <ThemeToggle size="sm" />
            <AuthActions />
          </div>

          <button
            className="xl:hidden w-10 h-10 rounded-[10px] border border-[var(--card-border)] bg-card flex items-center justify-center text-muted-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="absolute top-[72px] left-4 right-4 sm:left-6 sm:right-6 bg-card rounded-[20px] p-6 xl:hidden flex flex-col gap-4 shadow-lg border border-[var(--card-border)] max-h-[calc(100dvh-90px)] overflow-y-auto"
          >
            {navLinks.map((link, idx) => (
              <motion.a
                key={link.name}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                href={link.href}
                className="text-base font-semibold text-foreground/90 hover:text-primary py-1"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  scrollToHash(link.href);
                }}
              >
                {link.name}
              </motion.a>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle size="sm" />
              </div>
              <AuthActions mobile onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

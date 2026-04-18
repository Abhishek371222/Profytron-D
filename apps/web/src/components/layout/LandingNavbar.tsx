'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/ui/Interactions';
import { cn } from '@/lib/utils';

const navLinks = [
 { name: 'Capabilities', href: '#features' },
 { name: 'How it Works', href: '#how-it-works' },
 { name: 'Pricing', href: '#pricing' },
 { name: 'Reviews', href: '#testimonials' },
];

export function LandingNavbar() {
 const [mounted, setMounted] = useState(false);
 const [isScrolled, setIsScrolled] = useState(false);
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

 // Set mounted state to true once client is ready
 useEffect(() => {
 setMounted(true);
 }, []);

 useEffect(() => {
 if (!mounted) return;
 
 const handleScroll = () => {
 setIsScrolled(window.scrollY > 20);
 };
 window.addEventListener('scroll', handleScroll, { passive: true });
 handleScroll();
 return () => window.removeEventListener('scroll', handleScroll);
 }, [mounted]);

 return (
 <nav
 className={cn(
 'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
 isScrolled ? 'py-3' : 'py-8'
 )}
 role="navigation"
 aria-label="Main navigation"
 >
 <div className="container mx-auto px-6">
 <div 
 className={cn(
"flex items-center justify-between transition-all duration-500 px-6 py-3 rounded-3xl border border-transparent w-full",
 isScrolled && mounted
 ?"glass-ultra shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border-white/10" 
 :"bg-transparent"
 )}
 >
 {/* Logo */}
 <Link href="/" className="flex items-center gap-3 group" aria-label="Profytron Home">
 <div className="w-11 h-11 bg-primary/20 rounded-[14px] flex items-center justify-center border border-primary/30 group-hover:bg-primary/30 transition-all duration-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] group-hover:rotate-[15deg] group-hover:scale-110">
 <Zap className="w-6 h-6 text-primary fill-primary" aria-hidden="true" />
 </div>
 <span className="text-2xl font-display font-semibold tracking-tight text-white group-hover:text-primary transition-colors">
 PROFY<span className="text-primary group-hover:text-white transition-colors duration-500">TRON</span>
 </span>
 </Link>

 {/* Desktop Navigation */}
 <div className="hidden lg:flex items-center gap-8 bg-black/35 border border-white/10 py-2 px-8 rounded-full backdrop-blur-3xl shadow-inner">
 {navLinks.map((link) => (
 <Magnetic key={link.name} strength={0.2}>
 <a
 href={link.href}
 onClick={(e) => {
 e.preventDefault();
 const targetId = link.href.replace(/.*\#/, "");
 const elem = document.getElementById(targetId);
 if (elem) {
 const top = elem.getBoundingClientRect().top + window.scrollY - 100;
 window.scrollTo({ top, behavior: "smooth" });
 }
 }}
 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all duration-300 relative group/link cursor-pointer"
 >
 {link.name}
 <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-500 group-hover/link:w-full" />
 </a>
 </Magnetic>
 ))}
 </div>

 {/* Desktop Actions */}
 <div className="hidden md:flex items-center gap-4">
 <Magnetic strength={0.1}>
 <Link href="/login">
 <Button variant="ghost" className="hover:bg-white/5 font-semibold text-xs tracking-[0.2em] uppercase text-white/60 hover:text-white">
 Sign In
 </Button>
 </Link>
 </Magnetic>
 <Magnetic strength={0.25}>
 <Link href="/register">
 <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-8 h-12 rounded-[14px] group transition-all duration-500 shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.6)] relative overflow-hidden uppercase tracking-widest">
 <span className="relative z-10 flex items-center gap-2">
 Get Started
 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
 </span>
 <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
 </Button>
 </Link>
 </Magnetic>
 </div>

 {/* Mobile Toggle */}
 <button
 className="lg:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
 aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
 aria-expanded={mobileMenuOpen}
 >
 {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
 </button>
 </div>
 </div>

 {/* Mobile Menu */}
 <AnimatePresence>
 {mobileMenuOpen && (
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 transition={{ type:"spring", damping: 25, stiffness: 200 }}
 className="absolute top-[80px] left-6 right-6 glass-ultra rounded-3xl p-8 lg:hidden flex flex-col gap-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border-white/10 overflow-hidden"
 >
 {navLinks.map((link, idx) => (
 <motion.div
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: idx * 0.1 }}
 key={link.name}
 >
 <a
 href={link.href}
 className="text-xl font-display font-bold text-white/70 hover:text-primary transition-colors flex items-center justify-between group cursor-pointer"
 onClick={(e) => {
 e.preventDefault();
 setMobileMenuOpen(false);
 const targetId = link.href.replace(/.*\#/, "");
 const elem = document.getElementById(targetId);
 if (elem) {
 const top = elem.getBoundingClientRect().top + window.scrollY - 100;
 window.scrollTo({ top, behavior: "smooth" });
 }
 }}
 >
 {link.name}
 <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all text-primary" />
 </a>
 </motion.div>
 ))}
 <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
 <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
 <Button variant="outline" className="w-full h-14 text-sm font-semibold uppercase tracking-widest rounded-[14px] border-white/10 bg-white/5 text-white">
 Sign In
 </Button>
 </Link>
 <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
 <Button className="w-full h-14 text-sm font-semibold uppercase tracking-widest rounded-[14px] bg-primary text-white shadow-lg shadow-primary/20">
 Get Started
 </Button>
 </Link>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </nav>
 );
}

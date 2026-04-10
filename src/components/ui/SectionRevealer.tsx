"use client";

import React, { useEffect, useRef } from"react";

interface SectionRevealerProps {
 children: React.ReactNode;
 className?: string;
 delay?: number;
}

// Pure CSS + IntersectionObserver — no GSAP needed for a simple y:10→0 reveal.
// This removes the ScrollTrigger dependency from every section bundle.
export function SectionRevealer({
 children,
 className ="",
 delay = 0,
}: SectionRevealerProps) {
 const sectionRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const element = sectionRef.current;
 if (!element) return;

 const observer = new IntersectionObserver(
 ([entry]) => {
 if (entry.isIntersecting) {
 // Apply the reveal after the optional delay
 const timer = setTimeout(() => {
 element.style.opacity ="1";
 element.style.transform ="translateY(0) scale(1)";
 }, delay * 1000);
 observer.unobserve(element);
 return () => clearTimeout(timer);
 }
 },
 { threshold: 0.05, rootMargin:"0px 0px -5% 0px" }
 );

 observer.observe(element);
 return () => observer.disconnect();
 }, [delay]);

 return (
 <div
 ref={sectionRef}
 className={className}
 style={{
 opacity: 0,
 transform:"translateY(10px) scale(0.99)",
 transition: `opacity 0.4s ease-out ${delay * 1000}ms, transform 0.4s ease-out ${delay * 1000}ms`,
 willChange:"opacity, transform",
 }}
 >
 {children}
 </div>
 );
}

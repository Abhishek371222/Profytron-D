"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Quote, Star, ArrowUpRight, Terminal } from "lucide-react";
import { FadeUp, StaggerList } from "@/components/animations";

const testimonials = [
  {
    quote:
      "PROFYTRON has completely transformed how our proprietary desk handles high-frequency execution. The latency is incomparable.",
    author: "Jameson Vane",
    role: "Chief Strategy Officer",
    company: "Vanguard Alpha",
    image: "/images/avatar-1.png",
    rating: 5,
    metrics: "+42% Alpha",
  },
  {
    quote:
      "The visual strategy builder is a masterclass. We've reduced our concept-to-production time by over 70%.",
    author: "Elena Soros",
    role: "Quant Researcher",
    company: "Nexus Capital",
    image: null,
    rating: 5,
    metrics: "-70% Dev Time",
  },
  {
    quote:
      "Security and compliance were our primary concerns. PROFYTRON delivered a bank-grade environment.",
    author: "Marcus Chen",
    role: "Head of Infrastructure",
    company: "Standard Trading",
    image: null,
    rating: 5,
    metrics: "Node Verified",
  },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-22 bg-[#050505] relative overflow-hidden border-t border-white/5"
    >
      {/* Heavy Grid Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.08)_0%,transparent_70%)]" />
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-10">
          <FadeUp>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/70 text-[10px] font-bold uppercase tracking-[0.4em] mb-6 shadow-inner">
              <Terminal className="w-3 h-3 text-p" />
              <span>Verification_Logs</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-white m-0">
              Validated by the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-p to-cyan-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                Industry Elite.
              </span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.2} className="hidden md:block">
            <p className="text-white/40 text-lg font-medium max-w-sm text-right">
              Top-tier quantitative firms and proprietary trading desks rely on
              our architecture to maintain their market edge.
            </p>
          </FadeUp>
        </div>

        {/* Sleek Terminal Block Layout for Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.author}
              variants={{
                hidden: { opacity: 0, scale: 0.98, y: 30 },
                show: { opacity: 1, scale: 1, y: 0 },
              }}
              className="group relative rounded-2xl bg-[#090909] border border-white/5 flex flex-col overflow-hidden hover:border-white/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-20px_rgba(99,102,241,0.15)]"
            >
              {/* Terminal Header */}
              <div className="h-10 bg-[#050505] border-b border-white/5 flex flex-row items-center justify-between px-4 w-full shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-red-500/50 transition-colors" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-yellow-500/50 transition-colors delay-75" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-green-500/50 transition-colors delay-150" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-white/20 group-hover:text-p/60 transition-colors">
                    {testimonial.metrics}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-p/20 group-hover:bg-p group-hover:animate-pulse transition-all shadow-[0_0_10px_#6366f1] opacity-0 group-hover:opacity-100" />
                </div>
              </div>

              {/* Fake UI Background Textures */}
              <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.10] mix-blend-overlay pointer-events-none" />

              <div className="relative z-10 flex flex-col justify-between flex-1 p-8 md:p-10 gap-8 bg-gradient-to-b from-transparent to-[#050505]/50 hover:to-[#050505] transition-colors">
                {/* Quote Text */}
                <div className="relative">
                  <Quote className="absolute -top-4 -left-4 w-12 h-12 text-white/[0.03] rotate-12 group-hover:text-p/10 transition-colors duration-500" />
                  <p className="text-xl md:text-[22px] leading-relaxed text-white/60 font-medium tracking-tight group-hover:text-white/90 transition-colors duration-500 relative z-10 italic">
                    "{testimonial.quote}"
                  </p>
                </div>

                {/* Rating & Author Info */}
                <div className="flex flex-col gap-6 mt-auto">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-3.5 h-3.5 fill-current text-white/10 group-hover:text-p transition-colors duration-500`}
                        style={{ transitionDelay: `${idx * 50}ms` }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A1A1A] to-[#111] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-p/40 transition-colors duration-500">
                      {testimonial.image ? (
                        <Image
                          src={testimonial.image}
                          alt={testimonial.author}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                        />
                      ) : (
                        <span className="font-bold text-lg text-white/50 group-hover:text-white transition-colors">
                          {testimonial.author[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <h5 className="text-sm font-bold text-white tracking-wide uppercase">
                        {testimonial.author}
                      </h5>
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.1em] font-semibold mt-1">
                        {testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

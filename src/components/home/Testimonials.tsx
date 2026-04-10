'use client';

import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { FadeUp, StaggerList } from '@/components/animations';

const testimonials = [
  {
    quote: "PROFYTRON has completely transformed how our proprietary desk handles high-frequency execution. The latency is incomparable.",
    author: "Jameson Vane",
    role: "Chief Strategy Officer",
    company: "Vanguard Alpha",
    image: "/images/avatar-1.png",
    rating: 5,
  },
  {
    quote: "The visual strategy builder is a masterclass in UX. We've reduced our concept-to-production time by over 70%.",
    author: "Elena Soros",
    role: "Quant Researcher",
    company: "Nexus Capital",
    image: null,
    rating: 5,
  },
  {
    quote: "Security and compliance were our primary concerns. PROFYTRON delivered a bank-grade environment that our auditors loved.",
    author: "Marcus Chen",
    role: "Head of Infrastructure",
    company: "Standard Trading Corp",
    image: null,
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-40 relative overflow-hidden bg-black">
      {/* Background Decorative Architecture */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
         <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-p/10 blur-[150px] rounded-full translate-x-1/4 translate-y-1/4" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay opacity-30" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-32">
          <FadeUp>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-p/10 border border-p/20 text-p text-[10px] font-black uppercase tracking-[0.5em] mb-8 font-syne">
               <Quote className="w-4 h-4" />
               Validated_User_Experience
            </div>
            <h2 className="text-6xl md:text-8xl font-syne font-black mb-10 leading-[0.9] tracking-tighter uppercase italic text-white">
              Trusted by the <br />
              <span className="text-white/10 outline-text">Frontier.</span>
            </h2>
          </FadeUp>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.author}
                variants={{
                  hidden: { opacity: 0, scale: 0.98, y: 30 },
                  show: { opacity: 1, scale: 1, y: 0 },
                }}
                className="group relative p-12 rounded-[52px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-700 min-h-[450px] flex flex-col justify-between overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-12 w-16 h-1 bg-p opacity-0 group-hover:opacity-100 transition-all duration-700 shadow-[0_0_15px_#6366f1]" />
                
                {/* Quote Icon */}
                <div className="absolute top-10 right-12 opacity-5 transition-all duration-700 group-hover:opacity-20 group-hover:rotate-12">
                  <Quote className="w-24 h-24 text-p" />
                </div>

                <div className="relative z-10">
                    <div className="flex gap-1.5 mb-10 text-p">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                      ))}
                    </div>

                    <p className="text-xl md:text-2xl text-white/60 leading-relaxed mb-12 italic font-syne font-medium tracking-tight group-hover:text-white transition-colors duration-500">
                      "{testimonial.quote}"
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-6 pt-10 border-t border-white/5 mt-auto">
                  <div className="w-20 h-20 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    {testimonial.image ? (
                      <img src={testimonial.image} alt={testimonial.author} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-syne font-black text-3xl text-p">{testimonial.author[0]}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h5 className="text-xl font-syne font-black text-white italic tracking-tighter uppercase">{testimonial.author}</h5>
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black mt-2 font-syne">
                      {testimonial.role} <span className="text-white/10 px-1">//</span> <span className="text-p">{testimonial.company}</span>
                    </p>
                  </div>
                </div>

                {/* Holographic Scanlines */}
                <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none" />
              </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
}

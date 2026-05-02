"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal } from "lucide-react";
import { FadeUp } from "@/components/animations";

export function CTABanner() {
  return (
    <section className="pt-2 pb-32 relative overflow-hidden bg-black">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div className="relative rounded-4xl bg-[#050505] border border-white/5 p-16 md:p-24 overflow-hidden group shadow-2xl">
          {/* Subtle glow bleeding from center to look like a core */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-100 bg-p/10 blur-[120px] rounded-full pointer-events-none group-hover:bg-p/20 transition-all duration-1000" />

          {/* Vercel-style subtle geometric grid softly fading at all edges */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_0%,transparent_100%)] opacity-[0.04] pointer-events-none" />
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.15] mix-blend-overlay pointer-events-none" />

          <div className="relative z-10 text-center max-w-3xl mx-auto flex flex-col items-center">
            <FadeUp>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/3 border border-white/8 text-white/60 text-[11px] font-medium tracking-widest uppercase mb-8 backdrop-blur-md">
                <Terminal className="w-3 h-3 text-p" />
                Starting up
              </div>

              <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight text-white m-0 leading-[1.1]">
                Ready to deploy <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-white to-white/30">
                  pure alpha?
                </span>
              </h2>

              <p className="text-lg md:text-xl text-white/40 mb-12 leading-relaxed font-medium">
                Join the fastest-growing network of quantitative developers.
                Build your strategy, deploy to our nodes, and execute with zero
                Speed.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                <a href="/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-14 px-10 text-base bg-white hover:bg-gray-200 text-black rounded-full font-bold transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] group"
                  >
                    <span className="flex items-center gap-2">
                      Start Building
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </a>
                <a href="/docs" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full sm:w-auto h-14 px-10 text-base border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-full font-bold transition-all"
                  >
                    Read Documentation
                  </Button>
                </a>
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

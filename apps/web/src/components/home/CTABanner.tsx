"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { FadeUp } from "@/components/animations";

/* Particle burst canvas */
function BurstCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    interface Orb { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; hue: number; }
    const orbs: Orb[] = [];

    const spawn = () => {
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      const cx = W / 2, cy = H / 2;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.18 + Math.random() * 0.45;
      orbs.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0, max: 200 + Math.random() * 180,
        r: 1.2 + Math.random() * 2.2,
        hue: Math.random() < 0.5 ? 262 : (Math.random() < 0.5 ? 196 : 244),
      });
    };

    const draw = (ts: number) => {
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      // Spawn
      if (Math.random() < 0.35) spawn();

      for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];
        o.x += o.vx; o.y += o.vy; o.life++;
        o.vx *= 0.998; o.vy *= 0.998;

        if (o.life >= o.max) { orbs.splice(i, 1); continue; }

        const progress = o.life / o.max;
        const a = progress < 0.3
          ? (progress / 0.3) * 0.7
          : (1 - (progress - 0.3) / 0.7) * 0.7;

        ctx.save();
        ctx.shadowColor = `hsla(${o.hue}, 80%, 70%, 0.8)`;
        ctx.shadowBlur = 10;
        ctx.fillStyle = `hsla(${o.hue}, 80%, 75%, ${a})`;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Pulsing core glow
      const W2 = canvas.offsetWidth, H2 = canvas.offsetHeight;
      const pulse = 0.5 + 0.5 * Math.sin(ts * 0.001);
      const cg = ctx.createRadialGradient(W2 / 2, H2 / 2, 0, W2 / 2, H2 / 2, Math.min(W2, H2) * 0.45);
      cg.addColorStop(0, `rgba(99,102,241,${0.12 + pulse * 0.08})`);
      cg.addColorStop(0.5, `rgba(139,92,246,${0.04 + pulse * 0.03})`);
      cg.addColorStop(1, "transparent");
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, W2, H2);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export function CTABanner() {
  return (
    <section className="pt-2 pb-32 relative overflow-hidden bg-black">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div className="relative rounded-[32px] border border-white/[0.08] p-14 md:p-24 overflow-hidden group">
          {/* Burst canvas */}
          <BurstCanvas />

          {/* Fine grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "3.5rem 3.5rem",
              maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 0%, transparent 100%)",
              opacity: 0.025,
            }}
          />

          {/* Noise */}
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.12] mix-blend-overlay pointer-events-none" />

          {/* Animated border glow */}
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent pointer-events-none"
          />
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none"
          />

          <div className="relative z-10 text-center max-w-3xl mx-auto flex flex-col items-center">
            <FadeUp>
              {/* Badge */}
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-white/55 text-[11px] font-bold tracking-widest uppercase mb-8 backdrop-blur-md"
              >
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-violet-400"
                  style={{ boxShadow: "0 0 6px #8b5cf6" }}
                />
                Ready to deploy
              </motion.div>

              {/* Headline */}
              <h2 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-[-0.03em] text-white leading-[1.05]">
                Ready to deploy{" "}
                <br />
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #6366f1 45%, #22d3ee)" }}
                >
                  pure alpha?
                </span>
              </h2>

              <p className="text-lg md:text-xl text-white/40 mb-12 leading-relaxed font-medium max-w-xl">
                Join the fastest-growing network of quantitative developers. Build
                your strategy, deploy to our nodes, and execute with zero latency.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                <a href="/register" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full sm:w-auto h-14 px-10 text-base text-black rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 group relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #a855f7, #6366f1, #22d3ee)",
                      boxShadow: "0 0 50px rgba(139,92,246,0.4), 0 4px 24px rgba(0,0,0,0.5)",
                    }}
                  >
                    <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                    <span className="relative flex items-center gap-2">
                      Start Building
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>
                </a>

                <a href="/docs" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full sm:w-auto h-14 px-10 text-base border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] text-white rounded-full font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-violet-400" />
                    Read Documentation
                  </motion.button>
                </a>
              </div>

              {/* Trust signals */}
              <div className="flex items-center gap-8 mt-10 flex-wrap justify-center">
                {[
                  "No credit card required",
                  "Free 14-day trial",
                  "Cancel anytime",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-white/35 font-medium uppercase tracking-widest">{item}</span>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

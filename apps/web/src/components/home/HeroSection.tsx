"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { ArrowRight, Play, Zap, BarChart2, Users, TrendingUp } from "lucide-react";
import { Magnetic } from "@/components/ui/Interactions";

const BG = "#000000";

/* ══════════════════════════════════════════════════════════
   COMBINED CANVAS: Aurora blobs + Particle neural network + Waves
══════════════════════════════════════════════════════════ */
function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

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

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener("mousemove", handleMouse);

    interface Particle { x: number; y: number; vx: number; vy: number; r: number; }
    let particles: Particle[] = [];
    const initParticles = () => {
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      particles = Array.from({ length: 90 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.38,
        vy: (Math.random() - 0.5) * 0.38,
        r: 1.0 + Math.random() * 1.4,
      }));
    };
    initParticles();

    const sparks: { x: number; y: number; vy: number; life: number; max: number }[] = [];

    const draw = (ts: number) => {
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // Aurora blob 1 — violet (right-center)
      {
        const bx = W * 0.65 + Math.sin(ts * 0.00028) * W * 0.12;
        const by = H * 0.38 + Math.cos(ts * 0.00022) * H * 0.15;
        const br = Math.min(W, H) * 0.68;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, "rgba(139,92,246,0.22)");
        g.addColorStop(0.4, "rgba(139,92,246,0.07)");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      // Aurora blob 2 — cyan (far right)
      {
        const bx = W * 0.82 + Math.cos(ts * 0.00034) * W * 0.09;
        const by = H * 0.62 + Math.sin(ts * 0.00029) * H * 0.13;
        const br = Math.min(W, H) * 0.52;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, "rgba(6,182,212,0.18)");
        g.addColorStop(0.4, "rgba(6,182,212,0.05)");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      // Aurora blob 3 — indigo (center)
      {
        const bx = W * 0.5 + Math.sin(ts * 0.00019) * W * 0.08;
        const by = H * 0.5 + Math.cos(ts * 0.00024) * H * 0.09;
        const br = Math.min(W, H) * 0.44;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, "rgba(99,102,241,0.13)");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }

      // Update particles
      const CONNECT = 145, MOUSE_R = 110;
      for (const p of particles) {
        const dx = p.x - mouse.current.x;
        const dy = p.y - mouse.current.y;
        const d2 = Math.sqrt(dx * dx + dy * dy);
        if (d2 < MOUSE_R && d2 > 0) {
          const force = ((MOUSE_R - d2) / MOUSE_R) * 0.55;
          p.vx += (dx / d2) * force;
          p.vy += (dy / d2) * force;
        }
        p.vx *= 0.99; p.vy *= 0.99;
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 1.9) { p.vx = (p.vx / spd) * 1.9; p.vy = (p.vy / spd) * 1.9; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > W) { p.x = W; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > H) { p.y = H; p.vy *= -1; }
      }

      // Connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT) {
            const a = (1 - d / CONNECT) * 0.13;
            ctx.strokeStyle = `rgba(139,92,246,${a})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Particle dots
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(167,139,250,0.38)";
        ctx.shadowColor = "rgba(139,92,246,0.55)";
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Wave lines
      const drawWave = (
        freq: number, amp: number, phase: number, speed: number,
        strokeRgb: string, fillAlpha: number, lw: number, blur: number
      ) => {
        ctx.save();
        ctx.shadowColor = `rgba(${strokeRgb},1)`;
        ctx.shadowBlur = blur;
        const pts: [number, number][] = [];
        for (let x = 0; x <= W; x += 4) {
          const y = H * 0.52
            + Math.sin(x * freq + phase + ts * speed) * amp
            + Math.sin(x * freq * 1.7 + phase * 0.6 + ts * speed * 0.8) * amp * 0.3;
          pts.push([x, y]);
        }
        const fg = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.95);
        fg.addColorStop(0, `rgba(${strokeRgb},${fillAlpha})`);
        fg.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.moveTo(0, H);
        pts.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.lineTo(W, H); ctx.closePath();
        ctx.fillStyle = fg; ctx.fill();
        const lg = ctx.createLinearGradient(0, 0, W, 0);
        lg.addColorStop(0, `rgba(${strokeRgb},0.15)`);
        lg.addColorStop(0.5, `rgba(${strokeRgb},1)`);
        lg.addColorStop(1, `rgba(${strokeRgb},0.2)`);
        ctx.beginPath(); ctx.lineWidth = lw; ctx.strokeStyle = lg;
        pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
        ctx.stroke();
        ctx.restore();
        if (Math.random() < 0.025) {
          const rx = Math.random() * W;
          const ry = H * 0.52 + Math.sin(rx * freq + phase + ts * speed) * amp;
          sparks.push({ x: rx, y: ry, vy: -0.55 - Math.random() * 0.45, life: 0, max: 60 + Math.random() * 55 });
        }
      };

      drawWave(0.008, H * 0.11, 0,   0.00045, "139,92,246",  0.06, 2.2, 16);
      drawWave(0.011, H * 0.07, 2.1, 0.00062, "6,182,212",   0.04, 1.5, 12);
      drawWave(0.006, H * 0.14, 4.4, 0.00033, "168,85,247",  0.03, 1.0, 8);

      // Sparkles
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.y += sp.vy; sp.life++;
        if (sp.life >= sp.max) { sparks.splice(i, 1); continue; }
        const a = (1 - sp.life / sp.max) * 0.65;
        ctx.save();
        ctx.shadowColor = "rgba(168,85,247,0.8)"; ctx.shadowBlur = 8;
        ctx.fillStyle = `rgba(210,190,255,${a})`;
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // Edge fades
      const fl = ctx.createLinearGradient(0, 0, W * 0.13, 0);
      fl.addColorStop(0, BG); fl.addColorStop(1, "transparent");
      ctx.fillStyle = fl; ctx.fillRect(0, 0, W * 0.13, H);
      const ft = ctx.createLinearGradient(0, 0, 0, H * 0.1);
      ft.addColorStop(0, BG); ft.addColorStop(1, "transparent");
      ctx.fillStyle = ft; ctx.fillRect(0, 0, W, H * 0.1);
      const fb = ctx.createLinearGradient(0, H * 0.8, 0, H);
      fb.addColorStop(0, "transparent"); fb.addColorStop(1, BG);
      ctx.fillStyle = fb; ctx.fillRect(0, H * 0.8, W, H * 0.2);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return <canvas ref={ref} className="w-full h-full block" />;
}

/* ══════════════════════════════════════════════════════════
   LETTER-BY-LETTER ANIMATED HEADLINE
══════════════════════════════════════════════════════════ */
function SplitHeadline({
  text,
  delay = 0,
  className = "",
  gradient = false,
}: {
  text: string;
  delay?: number;
  className?: string;
  gradient?: boolean;
}) {
  return (
    <span
      className={className}
      style={
        gradient
          ? {
              background: "linear-gradient(135deg, #a855f7 0%, #6366f1 45%, #22d3ee 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              display: "block",
            }
          : { display: "block" }
      }
    >
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 28, rotateX: -70 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            delay: delay + i * 0.028,
            duration: 0.52,
            ease: [0.23, 1, 0.32, 1],
          }}
          style={{ display: "inline-block", transformOrigin: "50% 100%" }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   ANIMATED SVG SPARKLINE for portfolio card
══════════════════════════════════════════════════════════ */
function SparklineChart() {
  const d = "M 0 38 L 14 30 L 28 34 L 42 18 L 56 26 L 70 12 L 84 20 L 98 8 L 112 4";
  return (
    <svg viewBox="0 0 112 44" className="w-full h-11 overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={`${d} L 112 44 L 0 44 Z`}
        fill="url(#sparkFill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      />
      <motion.path
        d={d}
        fill="none"
        stroke="#34d399"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 1.4, duration: 1.8, ease: "easeInOut" }}
      />
      <motion.circle
        cx={112}
        cy={4}
        r={3.5}
        fill="#34d399"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 3.2, duration: 0.4, ease: "backOut" }}
        style={{ filter: "drop-shadow(0 0 5px #34d399)" }}
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   LIVE TICKER FEED
══════════════════════════════════════════════════════════ */
const TICKERS = [
  { pair: "BTC/USD",  price: "$67,342", delta: "+2.41%", up: true  },
  { pair: "ETH/USD",  price: "$3,891",  delta: "+1.82%", up: true  },
  { pair: "SOL/USD",  price: "$178.40", delta: "−0.94%", up: false },
  { pair: "AAPL",     price: "$213.40", delta: "+0.76%", up: true  },
  { pair: "SPY",      price: "$542.10", delta: "+0.43%", up: true  },
  { pair: "TSLA",     price: "$247.80", delta: "−1.23%", up: false },
  { pair: "GBP/USD",  price: "1.2642",  delta: "+0.18%", up: true  },
  { pair: "GOLD",     price: "$2,341",  delta: "+0.32%", up: true  },
];

function LiveTickerFeed() {
  const [visible, setVisible] = useState([0, 1, 2, 3]);
  const [next, setNext] = useState(4);

  useEffect(() => {
    const id = setInterval(() => {
      const n = next % TICKERS.length;
      setVisible((prev) => [...prev.slice(1), n]);
      setNext(n + 1);
    }, 2400);
    return () => clearInterval(id);
  }, [next]);

  return (
    <div className="flex flex-col gap-2 w-[205px]">
      <AnimatePresence mode="popLayout">
        {visible.map((idx) => {
          const t = TICKERS[idx];
          return (
            <motion.div
              key={`${idx}-${t.pair}`}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border backdrop-blur-md"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderColor: t.up ? "rgba(52,211,153,0.2)" : "rgba(251,113,133,0.2)",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: t.up ? "#34d399" : "#fb7185",
                    boxShadow: `0 0 6px ${t.up ? "#34d399" : "#fb7185"}`,
                  }}
                />
                <span className="text-white/80 text-[11px] font-bold tracking-wide font-mono">{t.pair}</span>
              </div>
              <div className="text-right">
                <div className="text-white text-[11px] font-mono font-semibold">{t.price}</div>
                <div className={`text-[10px] font-bold ${t.up ? "text-emerald-400" : "text-rose-400"}`}>{t.delta}</div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div className="flex items-center gap-1.5 mt-0.5 px-1">
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
          style={{ boxShadow: "0 0 6px #34d399" }}
        />
        <span className="text-white/30 text-[9px] font-mono tracking-widest uppercase">Markets live</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN HERO SECTION
══════════════════════════════════════════════════════════ */
export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const waveY = useTransform(scrollY, [0, 600], [0, 120]);
  const contentY = useTransform(scrollY, [0, 400], [0, -40]);
  const contentOpacity = useTransform(scrollY, [0, 300], [1, 0.7]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { damping: 32, stiffness: 130 });
  const sy = useSpring(my, { damping: 32, stiffness: 130 });

  return (
    <section
      ref={ref}
      onMouseMove={(e) => {
        mx.set((e.clientX / window.innerWidth - 0.5) * 40);
        my.set((e.clientY / window.innerHeight - 0.5) * 40);
      }}
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: BG }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.30]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 38%, #000 100%)" }}
      />

      {/* Canvas */}
      <motion.div
        style={{ y: waveY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, delay: 0.2 }}
        className="absolute top-0 right-0 w-[60%] h-full hidden md:block z-0"
      >
        <HeroCanvas />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="container mx-auto px-6 lg:px-14 relative z-10 pt-24 pb-16"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-12 lg:gap-0">

          {/* ── LEFT: Copy ── */}
          <div className="flex-1 max-w-[600px]">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full"
              style={{
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.28)",
                color: "#c084fc",
              }}
            >
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-violet-400"
              />
              <span className="text-[10px] font-bold tracking-[0.32em] uppercase">
                Algorithmic Trading Platform
              </span>
            </motion.div>

            {/* Headline — letter by letter */}
            <h1
              className="font-extrabold leading-[0.92] tracking-[-0.04em] mb-7"
              style={{ perspective: "600px" }}
            >
              <SplitHeadline
                text="Stop Trading"
                delay={0.08}
                className="text-[clamp(2.8rem,6vw,5.6rem)] text-white"
              />
              <SplitHeadline
                text="Manually."
                delay={0.22}
                className="text-[clamp(2.8rem,6vw,5.6rem)]"
                gradient
              />
            </h1>

            {/* Body */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58, duration: 0.55, ease: "easeOut" }}
              className="text-[1.1rem] leading-relaxed mb-10 max-w-[490px]"
              style={{ color: "rgba(255,255,255,0.42)" }}
            >
              Build and deploy automated strategies in minutes. Profytron handles
              execution, AI risk management, and portfolio analytics — 24/7, without
              you watching the screen.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.72, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-start gap-3.5 mb-14"
            >
              <Magnetic strength={0.3}>
                <a href="/register">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-3 h-12 px-8 rounded-full text-[14px] font-bold text-black cursor-pointer relative overflow-hidden group"
                    style={{
                      background: "linear-gradient(135deg, #a855f7, #6366f1, #22d3ee)",
                      boxShadow: "0 0 40px rgba(139,92,246,0.45), 0 4px 20px rgba(0,0,0,0.4)",
                    }}
                  >
                    <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                    <span className="relative">Start Trading Free</span>
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      className="relative"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </motion.button>
                </a>
              </Magnetic>

              <Magnetic strength={0.15}>
                <a href="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2.5 h-12 px-7 rounded-full text-[14px] font-semibold cursor-pointer transition-all group"
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.55)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Watch 2-min Demo
                  </motion.button>
                </a>
              </Magnetic>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-10 pt-8"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              {[
                { icon: Zap,       val: "< 12ms",  label: "Execution"     },
                { icon: BarChart2, val: "50k+",    label: "Trades Done"   },
                { icon: Users,     val: "12,000+", label: "Active Traders" },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  className="flex flex-col gap-1.5 group"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.92 + i * 0.1 }}
                >
                  <div
                    className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.32em] font-bold"
                    style={{ color: "rgba(255,255,255,0.28)" }}
                  >
                    <s.icon className="w-3 h-3" />
                    {s.label}
                  </div>
                  <span className="text-[1.8rem] font-mono font-bold text-white tracking-tight group-hover:text-violet-400 transition-colors">
                    {s.val}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: Dashboard card + live tickers ── */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.0, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="hidden lg:flex flex-col items-end justify-center gap-4 pl-16 flex-shrink-0"
            style={{ x: sx, y: sy } as unknown as React.CSSProperties}
          >
            {/* Portfolio card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="w-[300px] px-5 py-5 rounded-[22px] backdrop-blur-xl relative overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(139,92,246,0.22)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* Top shine */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

              <div className="text-[10px] uppercase tracking-[0.28em] font-bold mb-1.5"
                style={{ color: "rgba(255,255,255,0.32)" }}>
                Total Portfolio Value
              </div>
              <div className="text-[2rem] font-mono font-bold text-white mb-1 tracking-tight">
                $128,420.00
              </div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[12px] font-bold">+$12,840  (+11.1%)</span>
                <span className="text-white/25 text-[10px] font-mono ml-1">This month</span>
              </div>

              {/* Sparkline */}
              <SparklineChart />

              {/* Mini stats row */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: "Win Rate", val: "73.4%", color: "text-emerald-400" },
                  { label: "Drawdown", val: "−4.2%", color: "text-rose-400" },
                  { label: "Sharpe",   val: "2.14",  color: "text-cyan-400"   },
                ].map((m) => (
                  <div key={m.label} className="flex flex-col items-center p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[9px] text-white/25 uppercase tracking-widest mb-0.5">{m.label}</span>
                    <span className={`text-[13px] font-bold ${m.color}`}>{m.val}</span>
                  </div>
                ))}
              </div>

              {/* Active bots indicator */}
              <div className="flex items-center gap-2 mt-3 px-2.5 py-1.5 rounded-lg bg-emerald-400/5 border border-emerald-400/10">
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  style={{ boxShadow: "0 0 6px #34d399" }}
                />
                <span className="text-[10px] text-emerald-400/70 font-mono font-bold uppercase tracking-wider">
                  3 bots executing live
                </span>
              </div>
            </motion.div>

            {/* Live tickers */}
            <LiveTickerFeed />
          </motion.div>

        </div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
        style={{ background: "linear-gradient(to bottom, transparent, #000)" }}
      />
    </section>
  );
}

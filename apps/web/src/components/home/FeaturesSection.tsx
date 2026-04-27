"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Cpu, Workflow, Zap, Shield, ArrowRight } from "lucide-react";
import { FadeUp } from "@/components/animations";
import { Tilt } from "@/components/ui/Interactions";

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-24 relative overflow-hidden bg-[#050505]"
    >
      {/* Subtle Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] mix-blend-overlay opacity-30" />
      </div>

      <div className="container mx-auto px-6 relative z-10 w-full max-w-[1400px]">
        <div className="max-w-3xl mb-24">
          <FadeUp>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/3 border border-white/10 text-white/70 text-[10px] font-bold uppercase tracking-[0.4em] mb-8 shadow-inner">
              <Cpu className="w-4 h-4 text-p animate-pulse" />
              <span>Core_Architecture</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-[-0.02em] text-white">
              Built for{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-white to-white/30">
                Total
              </span>{" "}
              <br />
              <span className="text-p drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                Market Dominance.
              </span>
            </h2>
            <p className="text-white/40 text-xl leading-relaxed font-medium">
              We abstracted the complexity of high-frequency trading
              infrastructure into a single, intuitive interface powered by
              neural networks.
            </p>
          </FadeUp>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
          {/* Card 1: Precision Execution */}
          <div className="col-span-1 md:col-span-8 group">
            <Tilt maxRotation={2}>
              <motion.div className="relative p-10 md:p-14 rounded-4xl border border-white/5 bg-[#111] hover:bg-[#151515] transition-colors duration-500 h-[480px] flex flex-col justify-between overflow-hidden shadow-2xl w-full">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-p/5 blur-[120px] rounded-full group-hover:bg-p/10 transition-all duration-700 pointer-events-none" />

                {/* Visual Graph Wrapper */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full md:w-[60%] h-full opacity-20 md:opacity-100 flex items-center justify-end pr-10 pointer-events-none overflow-hidden hidden sm:flex">
                  <div className="relative w-[350px] h-[350px]">
                    <div className="absolute top-1/4 left-10 w-3 h-3 bg-p rounded-full shadow-[0_0_15px_#6366f1] animate-ping" />
                    <div className="absolute top-[80%] left-[30%] w-2 h-2 bg-p/50 rounded-full shadow-[0_0_10px_#6366f1]" />
                    <div className="absolute top-1/2 right-[20%] w-4 h-4 bg-white/80 rounded-full shadow-[0_0_20px_#ffffff]" />

                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 350 350"
                    >
                      <path
                        d="M 40 87 Q 175 175 280 175"
                        fill="none"
                        stroke="url(#strokeGrad)"
                        strokeWidth="2"
                        strokeDasharray="6 6"
                      />
                      <path
                        d="M 105 280 Q 175 175 280 175"
                        fill="none"
                        stroke="url(#strokeGrad)"
                        strokeWidth="1"
                        className="opacity-50"
                      />
                      <defs>
                        <linearGradient
                          id="strokeGrad"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#6366f1"
                            stopOpacity="0"
                          />
                          <stop
                            offset="100%"
                            stopColor="#ffffff"
                            stopOpacity="0.8"
                          />
                        </linearGradient>
                      </defs>
                    </svg>

                    <motion.div
                      animate={{
                        x: [0, 240],
                        y: [60, 150],
                        opacity: [0, 1, 0],
                        scale: [0.8, 1.2, 0.8],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute top-4 left-10 w-2 h-2 bg-white rounded-full shadow-[0_0_15px_#ffffff]"
                    />
                  </div>
                </div>

                <div className="relative z-10 w-full md:max-w-[55%]">
                  <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center mb-8 shadow-inner">
                    <Zap className="w-8 h-8 text-white/80" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
                    Zero-Latency Routing
                  </h3>
                  <p className="text-lg text-white/50 leading-relaxed font-medium mb-12">
                    Colocated servers in NY4 and LD4 execute algorithmic trades
                    in under 42 microseconds, ensuring you never miss the
                    spread.
                  </p>

                  <div className="inline-flex items-center gap-4 bg-black/60 border border-white/5 px-5 py-3 rounded-xl backdrop-blur-md w-fit">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                    <span className="text-xs font-mono text-white/60 uppercase">
                      NY4 Cluster Active
                    </span>
                    <span className="text-xs font-mono text-emerald-400">
                      42μs
                    </span>
                  </div>
                </div>
              </motion.div>
            </Tilt>
          </div>

          {/* Card 2: Neural Signal Core */}
          <div className="col-span-1 md:col-span-4 group">
            <Tilt maxRotation={4}>
              <motion.div className="relative p-10 md:p-12 rounded-4xl border border-white/5 bg-[#111] hover:bg-[#151515] transition-colors duration-500 h-[480px] flex flex-col justify-end overflow-hidden shadow-2xl w-full">
                {/* Dot grid bg */}
                <div
                  className="absolute inset-0 opacity-[0.2]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
                    backgroundSize: "32px 32px",
                  }}
                />

                {/* ── Radar Sweep — sits above text, centered in upper area ── */}
                <div className="absolute top-0 left-0 right-0 bottom-[180px] flex items-center justify-center pointer-events-none">
                  <div className="relative w-[190px] h-[190px]">
                    {/* Concentric rings */}
                    <div className="absolute inset-0 rounded-full border border-indigo-500/10" />
                    <div className="absolute inset-[18%] rounded-full border border-indigo-500/12" />
                    <div className="absolute inset-[36%] rounded-full border border-indigo-400/20" />

                    {/* Cross-hair lines */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-px bg-indigo-500/8" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-px h-full bg-indigo-500/8" />
                    </div>

                    {/* Rotating sweep */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'conic-gradient(from 0deg, transparent 75%, rgba(99,102,241,0.18) 95%, rgba(99,102,241,0.04) 100%)',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    />

                    {/* Signal blips */}
                    {[
                      { top: '18%', left: '62%', delay: 0 },
                      { top: '58%', left: '22%', delay: 1.3 },
                      { top: '72%', left: '65%', delay: 2.6 },
                    ].map((pos, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400"
                        style={{ top: pos.top, left: pos.left }}
                        animate={{ opacity: [0, 1, 0.3], scale: [0.8, 1.3, 1] }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          delay: pos.delay,
                          ease: 'easeOut',
                        }}
                      />
                    ))}

                    {/* Center dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
                    </div>
                  </div>
                </div>

                <div className="relative z-10">
                  <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
                    Signal Core AI
                  </h3>
                  <p className="text-base text-white/50 leading-relaxed font-medium">
                    Multi-modal reinforcement learning models scanning social,
                    news, and complex orderbook flow continuously.
                  </p>
                </div>
              </motion.div>
            </Tilt>
          </div>


          {/* Card 3: Sentinel Risk Guard */}
          <div className="col-span-1 md:col-span-4 group">
            <Tilt maxRotation={4}>
              <motion.div className="relative p-10 md:p-12 rounded-4xl border border-white/5 bg-[#111] hover:bg-[#151515] transition-colors duration-500 h-[480px] flex flex-col justify-between overflow-hidden shadow-2xl w-full group">
                <div className="absolute top-0 left-0 w-full h-0.75 bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 shadow-inner">
                    <Shield className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
                    Sentinel Risk Guard
                  </h3>
                  <p className="text-base text-white/50 leading-relaxed font-medium">
                    Automated circuit breakers instantly halt execution during
                    abnormal tail-risk volatility events.
                  </p>
                </div>

                <div className="relative z-10 mt-8 bg-black/60 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex justify-between text-[11px] font-mono uppercase text-white/40">
                    <span>Drawdown Limit</span>
                    <span className="text-cyan-400">0.5%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                    <motion.div
                      animate={{ width: ["20%", "80%", "20%"] }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute top-0 left-0 h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                    />
                  </div>
                </div>
              </motion.div>
            </Tilt>
          </div>

          {/* Card 4: IDE Strategy Builder */}
          <div className="col-span-1 md:col-span-8 group">
            <Tilt maxRotation={2}>
              <motion.div className="relative p-10 md:p-14 rounded-4xl border border-white/5 bg-linear-to-br from-[#111] to-[#0A0A0A] hover:bg-linear-to-br hover:from-[#151515] hover:to-black transition-colors duration-500 h-auto md:h-[480px] flex flex-col md:flex-row items-center justify-between overflow-hidden shadow-2xl w-full gap-10 md:gap-0">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.15] mix-blend-overlay pointer-events-none" />

                <div className="relative z-10 w-full md:w-[50%] flex flex-col justify-center h-full">
                  <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center shadow-inner mb-8">
                    <Workflow className="w-8 h-8 text-white/80" />
                  </div>
                  <h3 className="text-3xl font-bold text-white tracking-tight mb-4">
                    Visual Strategy Builder
                  </h3>
                  <p className="text-lg text-white/50 leading-relaxed font-medium mb-10">
                    Drag, drop, and connect execution logic blocks to build
                    multi-dimensional algorithms. Backtest instantly against 10
                    years of tick-level data.
                  </p>
                  <Link
                    href="/strategies/builder"
                    className="group/btn relative inline-flex items-center justify-center w-fit gap-3 text-sm font-bold text-white px-8 py-4 rounded-xl transition-all"
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-p to-cyan-500 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.2)] group-hover/btn:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-shadow duration-500" />
                    <div className="absolute inset-[1px] bg-[#0c0c0c] rounded-[11px] group-hover/btn:bg-black/50 transition-colors duration-500" />
                    <span className="relative z-10 flex items-center gap-2 tracking-wide">
                      Open Canvas 
                      <ArrowRight className="w-4 h-4 text-p group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all duration-300" />
                    </span>
                  </Link>
                </div>

                {/* Fake IDE Editor UI */}
                <div className="relative z-10 w-full md:w-[45%] h-[300px] md:h-full flex items-center justify-center md:justify-end">
                  <div className="relative w-full max-w-[340px] h-[280px] border border-white/10 rounded-2xl bg-[#090909] shadow-2xl shadow-black overflow-hidden flex flex-col">
                    {/* Window Header */}
                    <div className="h-10 bg-white/2 border-b border-white/5 flex items-center px-4 gap-2 w-full shrink-0">
                      <div className="w-3 h-3 rounded-full bg-white/10" />
                      <div className="w-3 h-3 rounded-full bg-white/10" />
                      <div className="w-3 h-3 rounded-full bg-white/10" />
                    </div>

                    {/* Window Content / Canvas */}
                    <div
                      className="relative flex-1 w-full p-4 overflow-hidden bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)]"
                      style={{ backgroundSize: "16px 16px" }}
                    >
                      {/* Node 1 */}
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute top-6 left-6 px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl"
                      >
                        <span className="text-[11px] font-mono text-white/70">
                          RSI &gt; 70
                        </span>
                      </motion.div>

                      {/* Node 2 */}
                      <motion.div
                        animate={{ y: [0, 3, 0] }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 1,
                        }}
                        className="absolute top-[120px] left-10 px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl"
                      >
                        <span className="text-[11px] font-mono text-white/70">
                          MACD Cross
                        </span>
                      </motion.div>

                      {/* Action Node */}
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute top-[70px] right-6 px-4 py-2 bg-p/10 border border-p/30 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.15)] z-10"
                      >
                        <span className="text-[11px] font-mono font-bold text-p">
                          EXECUTE SHORT
                        </span>
                      </motion.div>

                      {/* SVG Connections */}
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none stroke-white/10"
                        fill="none"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M 100 40 Q 180 40 220 85"
                          strokeDasharray="4 4"
                        />
                        <path
                          d="M 120 135 Q 180 135 220 85"
                          strokeDasharray="4 4"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Tilt>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";
import { motion } from "framer-motion";
import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import {
  Zap,
  Target,
  Globe,
  Cpu,
  Shield,
  ArrowRight,
  Layers,
  Activity
} from "lucide-react";
import Link from "next/link";

const values = [
  {
    icon: Target,
    title: "Precision Over Speed",
    desc: "We build for accuracy first. Every microsecond saved in execution must first be earned through rigorous signal validation.",
  },
  {
    icon: Shield,
    title: "Your Integrity",
    desc: "Military-grade infrastructure meets transparent governance. Your capital operates under the same safeguards as sovereign wealth funds.",
  },
  {
    icon: Globe,
    title: "Globally Colocated",
    desc: "NY4 and LD4 nodes give every strategy the same proximity advantage that hedge funds spend millions to achieve.",
  },
  {
    icon: Cpu,
    title: "AI-Native Architecture",
    desc: "Signal Core AI isn't a feature add-on — it's the foundation. Every module is designed around neural-network decision primitives.",
  },
];

export default function AboutPage() {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/3 border border-white/10 text-white/50 text-[10px] font-bold tracking-[0.4em] uppercase mb-8">
              <Zap className="w-3 h-3 text-indigo-400" /> Company_Origin
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-[-0.03em] text-white leading-[1] mb-8">
              We Build for
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400">
                Edge, Not Average.
              </span>
            </h1>
            <p className="text-xl text-white/50 leading-relaxed max-w-2xl font-medium">
              Profytron was built by traders who were tired of institutional
              tools staying locked inside institutions. We took the
              infrastructure of the top 0.1% and engineered it into a platform
              anyone serious could deploy.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 border-y border-white/5">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.blockquote
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white/80 leading-relaxed border-l-2 border-indigo-500 pl-8"
          >
            "The gap between retail trading and institutional execution is not
            talent — it's infrastructure. We close that gap."
          </motion.blockquote>
          <p className="mt-6 text-white/30 text-sm pl-8 font-mono uppercase tracking-widest">
            — Profytron
          </p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-24 bg-black/30">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/3 border border-white/10 text-white/50 text-[10px] font-bold tracking-[0.4em] uppercase mb-6">
                <Layers className="w-3 h-3 text-indigo-400" /> Philosophical_Core
              </div>
              <h2 className="text-4xl font-bold text-white tracking-tight mb-8">
                The Future of<br />Execution Architectures
              </h2>
              <div className="space-y-6 text-white/50 leading-relaxed text-lg">
                <p>
                  We believe that the financial markets of the next decade will not be won by those with the most capital, but by those with the most refined digital architecture.
                </p>
                <p>
                  At Profytron, we are obsessed with the structural purity of signals. We don't just facilitate trades; we engineer environments where algorithms can breathe, learn, and execute without the friction of legacy infrastructure.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-3xl overflow-hidden border border-white/8 bg-white/2 flex items-center justify-center group"
            >
              <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-transparent" />
              <div className="relative z-10 w-3/4 h-3/4 border border-white/10 rounded-full flex items-center justify-center before:content-[''] before:absolute before:w-full before:h-full before:border before:border-indigo-500/20 before:rounded-full before:animate-ping after:content-[''] after:absolute after:w-1/2 after:h-1/2 after:border after:border-indigo-400/30 after:rounded-full">
                <Activity className="w-12 h-12 text-indigo-400 group-hover:scale-110 transition-transform duration-500" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/3 border border-white/10 text-white/50 text-[10px] font-bold tracking-[0.4em] uppercase mb-6">
              <Target className="w-3 h-3 text-indigo-400" /> Core_Values
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              What We Stand For
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl bg-white/2 border border-white/6 hover:border-indigo-500/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:bg-indigo-500/20 transition-colors">
                  <v.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{v.title}</h3>
                <p className="text-white/50 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Network / Vague Placeholder for Team/Timeline */}
      <section className="py-24 bg-black/20">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/3 border border-white/10 text-white/50 text-[10px] font-bold tracking-[0.4em] uppercase mb-6">
              Global_Network
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-8">
              A Borderless<br />Your Mind
            </h2>
            <p className="text-lg text-white/40 leading-relaxed mb-12 max-w-2xl mx-auto italic">
              "We operate at the intersection of quantitative intelligence and high-frequency infrastructure, managed by a collective of architects who believe in the democratization of institutional-grade tools."
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'Speed', value: '< 1ms' },
                { label: 'Nodes', value: 'Global' },
                { label: 'Integrity', value: 'AES-256' },
                { label: 'Uptime', value: '99.9%' },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-2xl font-bold text-white font-mono">{stat.value}</span>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">
              Join the Movement
            </h2>
            <p className="text-white/50 mb-10 text-lg">
              We're hiring engineers, quants, and builders who want to reshape
              finance.
            </p>
            <Link
              href="/careers"
              className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.5)]"
            >
              View Open Roles <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </PublicPageLayout>
  );
}

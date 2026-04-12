'use client';
import { motion } from 'framer-motion';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { ArrowRight, Mail, MessageSquare } from 'lucide-react';

// Instagram SVG (inline — not available in all lucide-react versions)
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

export default function CommunityPage() {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center py-28 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/8 blur-[140px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/40 text-[10px] font-bold tracking-[0.4em] uppercase mb-8">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
              />
              Community_Building
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-[-0.04em] text-white leading-[0.95] mb-8">
              We're Just<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Getting Started.
              </span>
            </h1>

            <p className="text-xl text-white/50 leading-relaxed max-w-2xl font-medium">
              Profytron is brand new. The community is forming right now — which means you get to help shape it from day one. Join early, get direct access to the team, and influence how the platform evolves.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Social cards */}
      <section className="pb-20 border-t border-white/[0.05]">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-16">

            {/* Discord — Coming Soon */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex flex-col h-full p-8 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-indigo-600/0 border border-indigo-500/10 opacity-60 select-none">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl border bg-indigo-500/10 border-indigo-500/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-indigo-400/60" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border-amber-500/20">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-1 h-1 rounded-full bg-amber-400"
                    />
                    Coming Soon
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-mono mb-1 text-indigo-400/50">Profytron Community</div>
                  <h3 className="text-xl font-bold text-white/60 mb-3 tracking-tight">Discord</h3>
                  <p className="text-white/30 text-sm leading-relaxed">
                    Our Discord server is being set up. Join the waitlist via email and we'll notify you the moment it launches.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-6 text-sm font-semibold text-white/20 cursor-not-allowed">
                  Server launching soon
                </div>
              </div>
            </motion.div>

            {/* Instagram */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              viewport={{ once: true }}
            >
              <a
                href="https://www.instagram.com/profytron/"
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col h-full p-8 rounded-2xl bg-gradient-to-br from-pink-600/15 to-purple-600/5 border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl border bg-pink-500/10 border-pink-500/20 flex items-center justify-center">
                    <InstagramIcon className="w-5 h-5 text-pink-400" />
                  </div>
                  <span className="px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest bg-pink-500/10 text-pink-300 border-pink-500/20">
                    Follow
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-mono mb-1 text-pink-400 opacity-70">@profytron</div>
                  <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Instagram</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Behind-the-scenes of building Profytron — platform updates, trading content, and team moments.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-6 text-sm font-semibold text-pink-400 group-hover:gap-3 transition-all">
                  Follow Us <ArrowRight className="w-4 h-4" />
                </div>
              </a>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Why join early */}
      <section className="py-20 border-t border-white/[0.05] bg-black/20">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-white tracking-tight mb-3">Why Join Early?</h2>
            <p className="text-white/40 text-sm">Being here at the start matters more than the number on the member counter.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { title: 'Direct Team Access', desc: 'Early members get to talk directly with the founders and engineers — not a support bot.' },
              { title: 'Shape the Roadmap', desc: 'Your feedback on what to build next actually reaches the people building it.' },
              { title: 'Early Feature Access', desc: 'New features and beta programmes go to community members first, before public release.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
              >
                <div className="w-6 h-px bg-indigo-500 mb-4" />
                <h4 className="font-bold text-white text-sm mb-2">{item.title}</h4>
                <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Direct contact */}
      <section className="py-20 border-t border-white/[0.05]">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-indigo-600/8 to-cyan-600/5 border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Prefer email?</h3>
              <p className="text-white/50 text-sm max-w-xs">Reach the team directly. We read every message.</p>
            </div>
            <a
              href="mailto:community@profytron.com"
              className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all shadow-[0_0_24px_rgba(99,102,241,0.3)] whitespace-nowrap"
            >
              <Mail className="w-4 h-4" /> community@profytron.com
            </a>
          </motion.div>
        </div>
      </section>
    </PublicPageLayout>
  );
}

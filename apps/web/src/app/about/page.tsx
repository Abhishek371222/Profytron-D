"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Target, Globe, Cpu, Shield, Zap, Layers } from "lucide-react";
import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import {
  MarketingHero,
  MarketingQuote,
  MarketingSplit,
  MarketingSection,
  MarketingGrid,
  MarketingCard,
  MarketingCta,
  MarketingPulseVisual,
} from "@/components/marketing/MarketingPage";
import { BrandLogoMark } from "@/components/brand/BrandLogoMark";

const values = [
  {
    icon: Target,
    title: "Precision Over Speed",
    desc: "Every microsecond saved in execution must first be earned through rigorous signal validation.",
  },
  {
    icon: Shield,
    title: "Your Integrity",
    desc: "Military-grade infrastructure meets transparent governance for your capital.",
  },
  {
    icon: Globe,
    title: "Globally Colocated",
    desc: "NY4 and LD4 nodes give strategies the proximity advantage institutions spend millions to achieve.",
  },
  {
    icon: Cpu,
    title: "AI-Native Architecture",
    desc: "Signal Core AI is the foundation - every module is built around neural-network decision primitives.",
  },
];

export default function AboutPage() {
  return (
    <PublicPageLayout>
      <MarketingHero
        eyebrow="Company"
        eyebrowIcon={Zap}
        title="We Build for"
        titleAccent="Edge, Not Average."
        description="Profytron was built by traders who were tired of institutional tools staying locked inside institutions. We engineered top 0.1% infrastructure into a platform anyone serious could deploy."
      />

      <MarketingQuote
        quote={`"The gap between retail trading and institutional execution is not talent - it is infrastructure. We close that gap."`}
      />

      <MarketingSplit
        eyebrow="Philosophical Core"
        eyebrowIcon={Layers}
        title={
          <>
            The Future of
            <br />
            Execution Architectures
          </>
        }
        visual={<MarketingPulseVisual />}
      >
        <p>
          We believe that the financial markets of the next decade will not be won by those with the
          most capital, but by those with the most refined digital architecture.
        </p>
        <p>
          At Profytron, we are obsessed with the structural purity of signals. We engineer
          environments where algorithms can breathe, learn, and execute without legacy friction.
        </p>
      </MarketingSplit>

      <MarketingSection>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <span className="landing-eyebrow mb-5">
            <Target className="h-3.5 w-3.5" />
            Core Values
          </span>
          <h2 className="brand-display-heading text-3xl sm:text-4xl">What We Stand For</h2>
        </motion.div>
        <MarketingGrid cols={2}>
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <MarketingCard hover className="h-full">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/15 bg-primary/10">
                  <v.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="dash-section-title mb-2">{v.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </MarketingCard>
            </motion.div>
          ))}
        </MarketingGrid>
      </MarketingSection>

      <MarketingBandStats />

      <MarketingCta
        title="Join the"
        titleAccent="Movement."
        description="We are hiring engineers, quants, and builders who want to reshape finance."
      >
        <Link
          href="/careers"
          className="inline-flex items-center gap-3 rounded-xl bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-cta)] transition hover:brightness-110"
        >
          View Open Roles <ArrowRight className="h-4 w-4" />
        </Link>
      </MarketingCta>
    </PublicPageLayout>
  );
}

function MarketingBandStats() {
  return (
    <section className="marketing-band">
      <div className="page-container max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="mb-6 flex justify-center opacity-90">
            <BrandLogoMark size={56} />
          </div>
          <span className="landing-eyebrow mb-5">Global Network</span>
          <h2 className="brand-display-heading mb-6 text-3xl sm:text-4xl">
            A Borderless
            <br />
            Trading Mind
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-base italic text-muted-foreground sm:text-lg">
            We operate at the intersection of quantitative intelligence and high-frequency
            infrastructure - democratizing institutional-grade tools.
          </p>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "Speed", value: "< 1ms" },
              { label: "Nodes", value: "Global" },
              { label: "Integrity", value: "AES-256" },
              { label: "Uptime", value: "99.9%" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <span className="font-mono text-2xl font-bold text-foreground">{stat.value}</span>
                <span className="dash-eyebrow text-[11px]">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
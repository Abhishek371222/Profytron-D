"use client";

import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandGradientText } from "@/components/brand/BrandGradientText";
import { BrandLogoAmbient } from "@/components/brand/BrandLogoMark";

export function MarketingHero({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  titleAccent,
  description,
  meta,
  children,
  className,
}: {
  eyebrow: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  titleAccent?: string;
  description?: string;
  meta?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("marketing-hero", className)}>
      <div className="page-container max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="landing-eyebrow mb-6">
            {EyebrowIcon ? <EyebrowIcon className="h-3.5 w-3.5" /> : null}
            {eyebrow}
          </span>
          <h1 className="brand-display-heading text-4xl sm:text-5xl md:text-[3.25rem] mb-5">
            {title}
            {titleAccent ? (
              <>
                {" "}
                <BrandGradientText>{titleAccent}</BrandGradientText>
              </>
            ) : null}
          </h1>
          {description ? (
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          ) : null}
          {meta ? <div className="mt-5">{meta}</div> : null}
          {children}
        </motion.div>
      </div>
    </section>
  );
}

export function MarketingQuote({
  quote,
  attribution = "Profytron",
}: {
  quote: string;
  attribution?: string;
}) {
  return (
    <section className="marketing-quote-band">
      <div className="page-container max-w-5xl">
        <motion.blockquote
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="marketing-quote"
        >
          {quote}
        </motion.blockquote>
        <p className="mt-5 pl-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          — {attribution}
        </p>
      </div>
    </section>
  );
}

export function MarketingBand({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("marketing-band", className)}>
      <div className="page-container max-w-5xl">{children}</div>
    </section>
  );
}

export function MarketingSection({
  children,
  className,
  narrow,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={cn("marketing-section", className)}>
      <div className={cn("page-container", narrow ? "max-w-4xl" : "max-w-5xl")}>
        {children}
      </div>
    </section>
  );
}

export function MarketingSplit({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  children,
  visual,
}: {
  eyebrow: string;
  eyebrowIcon?: LucideIcon;
  title: React.ReactNode;
  children: React.ReactNode;
  visual: React.ReactNode;
}) {
  return (
    <MarketingBand>
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="landing-eyebrow mb-6">
            {EyebrowIcon ? <EyebrowIcon className="h-3.5 w-3.5" /> : null}
            {eyebrow}
          </span>
          <h2 className="brand-display-heading mb-6 text-3xl sm:text-4xl">{title}</h2>
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {children}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="marketing-visual-panel marketing-visual-panel--blend"
        >
          {visual}
        </motion.div>
      </div>
    </MarketingBand>
  );
}

export function MarketingCard({
  children,
  className,
  hover,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "landing-panel p-6 sm:p-7",
        hover && "transition-shadow hover:shadow-[var(--shadow-card-hover)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MarketingGrid({
  children,
  cols = 3,
  className,
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  const colClass =
    cols === 2
      ? "sm:grid-cols-2"
      : cols === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={cn("grid grid-cols-1 gap-5", colClass, className)}>{children}</div>
  );
}

export function MarketingCta({
  title,
  titleAccent,
  description,
  children,
}: {
  title: string;
  titleAccent?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <MarketingSection className="border-t border-[var(--card-border)]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="brand-display-heading mb-4 text-3xl sm:text-4xl">
          {title}
          {titleAccent ? (
            <>
              {" "}
              <BrandGradientText>{titleAccent}</BrandGradientText>
            </>
          ) : null}
        </h2>
        {description ? (
          <p className="mb-8 text-base text-muted-foreground sm:text-lg">{description}</p>
        ) : null}
        {children}
      </motion.div>
    </MarketingSection>
  );
}

export function LegalDocumentLayout({
  eyebrow = "Legal",
  eyebrowIcon: EyebrowIcon,
  title,
  intro,
  effectiveDate,
  lastUpdated,
  sections,
}: {
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  intro?: string;
  effectiveDate?: string;
  lastUpdated?: string;
  sections: { title: string; content: string; highlight?: boolean }[];
}) {
  return (
    <>
      <MarketingHero
        eyebrow={eyebrow}
        eyebrowIcon={EyebrowIcon}
        title={title}
        description={intro}
        meta={
          effectiveDate || lastUpdated ? (
            <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
              {effectiveDate ? <span>Effective: {effectiveDate}</span> : null}
              {lastUpdated ? <span>Last updated: {lastUpdated}</span> : null}
            </div>
          ) : null
        }
      />

      {sections.length > 1 ? (
        <div className="sticky top-[calc(5.25rem+env(safe-area-inset-top,0px))] z-30 border-b border-[var(--card-border)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] backdrop-blur-md">
          <div className="page-container max-w-4xl py-3">
            <nav className="flex flex-wrap gap-2" aria-label="Document sections">
              {sections.map((s, i) => (
                <a
                  key={s.title}
                  href={`#legal-section-${i}`}
                  className="rounded-full border border-[var(--card-border)] bg-card px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/25 hover:text-primary"
                >
                  {i + 1}. {s.title.replace(/^\d+\.\s*/, "").slice(0, 28)}
                  {s.title.length > 32 ? "…" : ""}
                </a>
              ))}
            </nav>
          </div>
        </div>
      ) : null}

      <MarketingSection narrow className="pb-20">
        <div className="flex flex-col gap-6">
          {sections.map((s, i) => (
            <article
              key={s.title}
              id={`legal-section-${i}`}
              className={cn(
                "landing-panel scroll-mt-36 p-6 sm:p-8",
                s.highlight && "border-primary/30 ring-1 ring-primary/15",
              )}
            >
              <h2 className="dash-section-title mb-4">{s.title}</h2>
              <div className="whitespace-pre-line text-sm leading-[1.85] text-muted-foreground">
                {s.content}
              </div>
            </article>
          ))}
        </div>
      </MarketingSection>
    </>
  );
}

export function MarketingPulseVisual() {
  return <BrandLogoAmbient size="lg" />;
}

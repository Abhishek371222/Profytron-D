"use client";

import { BadgeCheck, Shield, Star } from "lucide-react";
import { BrandGradientText } from "@/components/brand/BrandGradientText";
import { TestimonialWall } from "@/components/home/TestimonialWall";

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="landing-section overflow-hidden border-t border-[var(--card-border)]"
    >
      <div className="page-container w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,320px)_1fr] gap-8 xl:gap-10 2xl:gap-12 items-start">
          {/* Left — trust column. The whole section already reveals on scroll
              via SectionRevealer, so this column needs no motion wrapper of its
              own (a nested framer reveal here can leave it stuck hidden). */}
          <div className="lg:sticky lg:top-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-6">
              <BadgeCheck className="w-3.5 h-3.5" />
              Verification Logs
            </span>

            <h2 id="testimonials-heading" className="brand-display-heading text-3xl sm:text-4xl mb-4">
              Validated by the{" "}
              <BrandGradientText>Industry Elite.</BrandGradientText>
            </h2>

            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              Trusted by quantitative firms and prop desks who can&apos;t afford to be wrong.
            </p>

            <div className="rounded-[20px] border border-[var(--card-border)] bg-card p-6 shadow-[0_8px_32px_rgba(15,23,42,0.06)]">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-2xl font-bold text-foreground">
                4.9<span className="text-lg text-muted-foreground font-semibold">/5</span>
                <span className="text-base font-medium text-muted-foreground ml-2">Average Rating</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">From 2,500+ verified reviews</p>

              <div className="pt-5 border-t border-[var(--card-border)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  Verified by
                </p>
                <div className="flex flex-wrap gap-2">
                  {["SOC 2", "ISO 27001", "GDPR"].map((cert) => (
                    <span
                      key={cert}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-semibold text-foreground"
                    >
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right — infinite credibility wall */}
          <div className="min-w-0">
            <TestimonialWall headingId="testimonials-heading" />
          </div>
        </div>
      </div>
    </section>
  );
}

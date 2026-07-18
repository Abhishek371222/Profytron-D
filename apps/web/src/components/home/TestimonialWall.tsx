"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeTone = "violet" | "emerald" | "rose" | "blue" | "amber";

export type Testimonial = {
  id: string;
  quote: string;
  author: string;
  company: string;
  metrics: string;
  metricsShort: string;
  badge: BadgeTone;
};

export const testimonials: Testimonial[] = [
  {
    id: "vanguard-alpha",
    quote:
      "PROFYTRON has completely transformed how our prop desk handles HFT execution. The speed is incomparable.",
    author: "Jameson Vane",
    company: "Vanguard Alpha",
    metrics: "+42% Alpha",
    metricsShort: "+42% Alpha",
    badge: "emerald",
  },
  {
    id: "nexus-capital",
    quote:
      "The visual strategy builder reduced our concept-to-production time by over 70% since switching.",
    author: "Elena Soros",
    company: "Nexus Capital",
    metrics: "−70% Dev Time",
    metricsShort: "−70% Dev",
    badge: "blue",
  },
  {
    id: "standard-trading",
    quote:
      "Bank-grade environment that our risk team fully trusts. Compliance review was the fastest we've seen.",
    author: "Marcus Chen",
    company: "Standard Trading",
    metrics: "SOC-2 Verified",
    metricsShort: "SOC-2",
    badge: "violet",
  },
  {
    id: "delta-quant",
    quote:
      "Finally an algo platform that doesn't feel legacy. The analytics dashboard alone is worth switching for.",
    author: "Priya Sharma",
    company: "Delta Quant",
    metrics: "+28% Efficiency",
    metricsShort: "+28%",
    badge: "emerald",
  },
  {
    id: "wexler-capital",
    quote:
      "Deployed three strategies in one afternoon. Backtest fidelity against tick data is institutional grade.",
    author: "Tom Wexler",
    company: "Wexler Capital",
    metrics: "3 Strategies Live",
    metricsShort: "3 Live",
    badge: "violet",
  },
  {
    id: "arc-systems",
    quote:
      "The risk sentinel saved my account during the flash crash. Circuit breakers fired before I saw the candle.",
    author: "Rena Park",
    company: "Arc Systems",
    metrics: "Flash Shielded",
    metricsShort: "Shielded",
    badge: "rose",
  },
  {
    id: "pulse-markets",
    quote:
      "Latency under 50ms on our NY4 routes. Execution quality matches what we had in-house at a fraction of cost.",
    author: "Omar Haddad",
    company: "Pulse Markets",
    metrics: "< 50ms Routing",
    metricsShort: "<50ms",
    badge: "blue",
  },
  {
    id: "northstar-desk",
    quote:
      "Onboarded 14 junior traders onto copy workflows in a week. Governance controls are exactly what we needed.",
    author: "Sofia Lind",
    company: "Northstar Desk",
    metrics: "14 Seats Live",
    metricsShort: "14 Seats",
    badge: "violet",
  },
  {
    id: "meridian-flow",
    quote:
      "Our Sharpe improved within the first month. Risk caps and kill-switches are first-class, not bolted on.",
    author: "Daniel Okoye",
    company: "Meridian Flow",
    metrics: "+1.8 Sharpe",
    metricsShort: "+1.8 Sharpe",
    badge: "emerald",
  },
  {
    id: "weiss-quant",
    quote:
      "Support resolved a broker API issue in under an hour. That level of ops maturity is rare in retail-facing tools.",
    author: "Hannah Weiss",
    company: "Weiss Quant",
    metrics: "24/7 Support",
    metricsShort: "24/7",
    badge: "amber",
  },
];

const badgeStyles: Record<BadgeTone, string> = {
  violet: "bg-primary/10 text-primary border-primary/20",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  rose: "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/25",
  blue: "bg-primary/10 text-primary border-primary/20",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

type CompactTreatment = "metric" | "verified" | "rating";

function compactTreatment(index: number): CompactTreatment {
  return (["metric", "verified", "rating"] as const)[index % 3];
}

function CompactCredibility({ t, index }: { t: Testimonial; index: number }) {
  const treatment = compactTreatment(index);

  if (treatment === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-primary">
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
        Verified
      </span>
    );
  }

  if (treatment === "rating") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-foreground">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
        5.0
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        badgeStyles[t.badge],
      )}
    >
      {t.metricsShort}
    </span>
  );
}

function CompactCard({
  t,
  index,
  active,
  onSelect,
}: {
  t: Testimonial;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onSelect}
      className={cn(
        "flex h-[172px] w-[300px] shrink-0 flex-col rounded-[18px] border bg-card p-4 text-left transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]",
        active
          ? "border-primary/45 shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_28%,transparent)]"
          : "border-[var(--card-border)] shadow-sm hover:border-[color-mix(in_srgb,var(--primary)_22%,var(--card-border))]",
      )}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <CompactCredibility t={t} index={index} />
        <Quote className="h-4 w-4 shrink-0 text-primary/25" aria-hidden />
      </div>

      <p className="line-clamp-3 flex-1 text-[13px] leading-snug text-foreground/80">
        {t.quote}
      </p>

      <div className="mt-3 flex items-center gap-2 border-t border-[var(--card-border)] pt-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
          {initials(t.author)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold leading-tight text-foreground">{t.author}</p>
          <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t.company}
          </p>
        </div>
      </div>
    </button>
  );
}

function MarqueeRow({
  items,
  reverse,
  duration,
  activeIndex,
  onSelect,
  repeat = 3,
}: {
  items: { t: Testimonial; index: number }[];
  reverse: boolean;
  duration: string;
  activeIndex: number;
  onSelect: (index: number) => void;
  repeat?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className="testimonial-fade-mask flex flex-row overflow-hidden [--gap:1rem] [gap:var(--gap)]"
      style={{ ["--duration" as string]: duration }}
    >
      {Array.from({ length: repeat }).map((_, copy) => (
        <div
          key={copy}
          className="animate-marquee flex shrink-0 flex-row [gap:var(--gap)] group-hover/wall:[animation-play-state:paused] group-focus-within/wall:[animation-play-state:paused]"
          style={{ animationDirection: reverse ? "reverse" : "normal" }}
        >
          {items.map(({ t, index }) => (
            <CompactCard
              key={`${copy}-${t.id}`}
              t={t}
              index={index}
              active={index === activeIndex}
              onSelect={() => onSelect(index)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function FocusedCard({
  activeIndex,
  total,
  onPrev,
  onNext,
  reduceMotion,
}: {
  activeIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  reduceMotion: boolean;
}) {
  const t = testimonials[activeIndex];
  const progress = ((activeIndex + 1) / total) * 100;

  const controlClass =
    "flex h-10 w-10 items-center justify-center rounded-full border border-[var(--card-border)] bg-card text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

  return (
    <div className="relative mx-auto w-full max-w-[720px]">
      <div className="relative overflow-hidden rounded-[22px] border border-primary/25 bg-[color-mix(in_srgb,var(--primary)_4%,var(--card))] p-6 shadow-[var(--shadow-card-hover)] sm:p-7">
        { }
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent)]"
        />

        <div className="relative flex min-h-[236px] flex-col">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              <BadgeCheck className="h-4 w-4" aria-hidden />
              Verified Customer
            </span>
            <span
              className={cn(
                "inline-flex w-fit items-center rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                badgeStyles[t.badge],
              )}
            >
              {t.metrics}
            </span>
          </div>

          { }
          <div className="flex flex-1 flex-col" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={t.id}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-1 flex-col"
              >
                <Quote className="mb-3 h-6 w-6 text-primary/30" aria-hidden />
                <p className="flex-1 text-[15px] leading-relaxed text-foreground/90 sm:text-base">
                  {t.quote}
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {initials(t.author)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight text-foreground">{t.author}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.company}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          { }
          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button type="button" onClick={onPrev} className={controlClass} aria-label="Previous testimonial">
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button type="button" onClick={onNext} className={controlClass} aria-label="Next testimonial">
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="flex flex-1 items-center gap-3">
              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--card-border)]">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
                />
              </div>
              <span
                data-testid="testimonial-position"
                className="shrink-0 font-mono text-xs font-semibold tabular-nums text-muted-foreground"
              >
                {String(activeIndex + 1).padStart(2, "0")}{" "}
                <span className="text-muted-foreground/50">/ {String(total).padStart(2, "0")}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileCarousel({
  activeIndex,
  setActiveIndex,
}: {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const total = testimonials.length;

  const scrollToIndex = useCallback((index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.children[index] as HTMLElement | undefined;
    if (card) {
      scroller.scrollTo({ left: card.offsetLeft - scroller.offsetLeft, behavior: "smooth" });
    }
  }, []);

  const onScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const children = Array.from(scroller.children) as HTMLElement[];
    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    let nearest = 0;
    let min = Infinity;
    children.forEach((child, i) => {
      const childCenter = child.offsetLeft - scroller.offsetLeft + child.clientWidth / 2;
      const dist = Math.abs(childCenter - center);
      if (dist < min) {
        min = dist;
        nearest = i;
      }
    });
    setActiveIndex(nearest);
  }, [setActiveIndex]);

  const go = (index: number) => {
    const next = (index + total) % total;
    setActiveIndex(next);
    scrollToIndex(next);
  };

  return (
    <div>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        data-lenis-prevent
        className="landing-trust-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1"
      >
        {testimonials.map((t) => (
          <article
            key={t.id}
            className="flex min-h-[230px] w-[85%] shrink-0 snap-center flex-col rounded-[20px] border border-[var(--card-border)] bg-card p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                <BadgeCheck className="h-4 w-4" aria-hidden />
                Verified
              </span>
              <span
                className={cn(
                  "inline-flex w-fit items-center rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                  badgeStyles[t.badge],
                )}
              >
                {t.metrics}
              </span>
            </div>
            <Quote className="mb-2 h-5 w-5 text-primary/30" aria-hidden />
            <p className="flex-1 text-[14px] leading-relaxed text-foreground/90">{t.quote}</p>
            <div className="mt-4 flex items-center gap-2.5 border-t border-[var(--card-border)] pt-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {initials(t.author)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold leading-tight text-foreground">{t.author}</p>
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.company}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(activeIndex - 1)}
            aria-label="Previous testimonial"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--card-border)] bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(activeIndex + 1)}
            aria-label="Next testimonial"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--card-border)] bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <span
          data-testid="testimonial-position"
          className="font-mono text-xs font-semibold tabular-nums text-muted-foreground"
        >
          {String(activeIndex + 1).padStart(2, "0")}{" "}
          <span className="text-muted-foreground/50">/ {String(total).padStart(2, "0")}</span>
        </span>
      </div>
    </div>
  );
}

export function TestimonialWall({ headingId }: { headingId?: string }) {
  const reduceMotion = useReducedMotion() ?? false;
  const total = testimonials.length;

  const [activeIndex, setActiveIndex] = useState(0);

  const upperItems = useMemo(
    () => testimonials.map((t, index) => ({ t, index })).filter((_, i) => i % 2 === 0),
    [],
  );
  const lowerItems = useMemo(
    () => testimonials.map((t, index) => ({ t, index })).filter((_, i) => i % 2 !== 0),
    [],
  );

  const goPrev = useCallback(() => {
    setActiveIndex((current) => (current === 0 ? total - 1 : current - 1));
  }, [total]);

  const goNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % total);
  }, [total]);

  const selectIndex = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  return (
    <div aria-labelledby={headingId}>
      { }
      {reduceMotion ? (
        <div className="hidden lg:block">
          <FocusedCard
            activeIndex={activeIndex}
            total={total}
            onPrev={goPrev}
            onNext={goNext}
            reduceMotion
          />
          { }
          <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
            {testimonials.map((t, index) => (
              <CompactCard
                key={t.id}
                t={t}
                index={index}
                active={index === activeIndex}
                onSelect={() => selectIndex(index)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="group/wall hidden flex-col gap-5 lg:flex">
          <MarqueeRow
            items={upperItems}
            reverse={false}
            duration="55s"
            activeIndex={activeIndex}
            onSelect={selectIndex}
          />

          <FocusedCard
            activeIndex={activeIndex}
            total={total}
            onPrev={goPrev}
            onNext={goNext}
            reduceMotion={false}
          />

          <MarqueeRow
            items={lowerItems}
            reverse
            duration="62s"
            activeIndex={activeIndex}
            onSelect={selectIndex}
          />
        </div>
      )}

      { }
      <div className="lg:hidden">
        <MobileCarousel activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
      </div>
    </div>
  );
}

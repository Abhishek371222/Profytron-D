/**
 * Lightweight placeholders for dynamically imported landing sections.
 * Pure markup + Tailwind pulse — no shimmer libs, no timers, no state.
 */

import type { ReactNode } from "react";

function Bone({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted/50 ${className}`}
    />
  );
}

function SectionShell({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`landing-section ${className}`}
      aria-hidden="true"
    >
      <div className="page-container relative z-10 w-full">{children}</div>
    </section>
  );
}

/** Approximate HowItWorks: sticky copy + step list. */
export function HowItWorksSkeleton() {
  return (
    <SectionShell
      id="how-it-works"
      className="overflow-hidden border-t border-[var(--card-border)]"
    >
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 xl:gap-20">
        <div>
          <Bone className="mb-6 h-7 w-36 rounded-full" />
          <Bone className="mb-3 h-10 w-[90%] max-w-md" />
          <Bone className="mb-3 h-10 w-[70%] max-w-sm" />
          <Bone className="mb-10 h-4 w-full max-w-lg" />
          <Bone className="mb-2 h-4 w-[95%] max-w-lg" />
          <Bone className="h-40 w-full max-w-lg rounded-[20px]" />
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

/** Approximate Features: eyebrow + title + 6 cards. */
export function FeaturesSkeleton() {
  return (
    <SectionShell className="relative py-20 sm:py-24">
      <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
        <Bone className="mx-auto mb-5 h-7 w-28 rounded-full" />
        <Bone className="mx-auto mb-3 h-9 w-[85%] max-w-lg" />
        <Bone className="mx-auto h-4 w-[70%] max-w-md" />
      </div>
      <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    </SectionShell>
  );
}

/** Approximate ValuePillars: centered header + 3 cards. */
export function ValuePillarsSkeleton() {
  return (
    <SectionShell className="overflow-hidden">
      <div className="mx-auto mb-14 max-w-3xl text-center sm:mb-16">
        <Bone className="mx-auto mb-5 h-7 w-40 rounded-full" />
        <Bone className="mx-auto mb-3 h-10 w-[90%] max-w-xl" />
        <Bone className="mx-auto mb-3 h-10 w-[60%] max-w-md" />
        <Bone className="mx-auto h-4 w-[80%] max-w-lg" />
      </div>
      <div className="grid items-stretch gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    </SectionShell>
  );
}

/** Approximate Pricing: header + plan cards. */
export function PricingSkeleton() {
  return (
    <SectionShell id="pricing" className="overflow-hidden">
      <div className="mb-10 text-center sm:mb-14">
        <Bone className="mx-auto mb-6 h-7 w-32 rounded-full" />
        <Bone className="mx-auto mb-3 h-11 w-[80%] max-w-lg" />
        <Bone className="mx-auto h-4 w-[70%] max-w-md" />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-[28rem] w-full rounded-2xl" />
        ))}
      </div>
    </SectionShell>
  );
}

/** Approximate CTA banner: copy + visual slot. */
export function CTABannerSkeleton() {
  return (
    <SectionShell className="overflow-hidden">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <Bone className="mb-6 h-7 w-48 rounded-full" />
          <Bone className="mb-3 h-10 w-[90%]" />
          <Bone className="mb-8 h-10 w-[55%]" />
          <Bone className="mb-4 h-4 w-full max-w-lg" />
          <Bone className="mb-8 h-4 w-[85%] max-w-md" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Bone className="h-12 w-full rounded-[14px] sm:w-48" />
            <Bone className="h-12 w-full rounded-[14px] sm:w-44" />
          </div>
        </div>
        <Bone className="hidden h-72 w-full rounded-2xl lg:block" />
      </div>
    </SectionShell>
  );
}

/** Approximate FAQ: sidebar + accordion rows + support card. */
export function FaqSkeleton() {
  return (
    <SectionShell id="faq">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4 xl:col-span-3">
          <Bone className="mb-5 h-7 w-44 rounded-full" />
          <Bone className="mb-3 h-8 w-[90%]" />
          <Bone className="mb-3 h-8 w-[70%]" />
          <Bone className="h-4 w-full" />
        </div>
        <div className="flex flex-col gap-3 lg:col-span-5 xl:col-span-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bone key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
        <Bone className="h-48 w-full rounded-2xl lg:col-span-3 xl:col-span-4" />
      </div>
    </SectionShell>
  );
}

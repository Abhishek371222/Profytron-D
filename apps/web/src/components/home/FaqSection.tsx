"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { FaqItem } from "@/components/seo/JsonLd";
import { LANDING_FAQ_ITEMS } from "@/lib/seo/faq-items";

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="divide-y divide-[var(--card-border)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? -1 : index)}
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30 sm:px-6 sm:py-5"
              aria-expanded={open}
            >
              <span className="pr-2 text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
                {item.question}
              </span>
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
                  open
                    ? "rotate-180 border-primary/20 bg-primary/10"
                    : "border-[var(--card-border)] bg-[var(--bg-secondary)]",
                )}
              >
                <ChevronDown className="h-4 w-4 text-primary" />
              </span>
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="answer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
                >
                  <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function SupportCard() {
  return (
    <div className="landing-panel h-fit p-6 sm:p-7 lg:sticky lg:top-28">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <MessageCircle className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-foreground">Still have questions?</h3>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        Our support team is here to help you succeed.
      </p>
      <Link
        href="mailto:support@profytron.com"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] text-sm font-semibold text-primary transition-colors hover:bg-muted/50"
      >
        Contact Support
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function FaqSection() {
  return (
    <section className="landing-section" id="faq">
      <div className="page-container w-full">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4 xl:col-span-3"
          >
            <span className="landing-eyebrow mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Frequently Asked Questions
            </span>

            <h2 className="brand-display-heading mb-4 text-2xl sm:text-3xl">
              Everything you need to{" "}
              <span className="brand-gradient-text">know.</span>
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Can&apos;t find an answer? Reach our support team in-app or at{" "}
              <a
                href="mailto:support@profytron.com"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                support@profytron.com
              </a>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="min-w-0 lg:col-span-5 xl:col-span-5"
          >
            <FaqAccordion items={LANDING_FAQ_ITEMS} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="min-w-0 lg:col-span-3 xl:col-span-4"
          >
            <SupportCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

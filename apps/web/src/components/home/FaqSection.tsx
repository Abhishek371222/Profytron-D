"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { FaqItem } from "@/components/seo/JsonLd";
import { FAQ_ITEMS } from "@/lib/seo/faq-items";

const LANDING_FAQ_ITEMS = FAQ_ITEMS.slice(0, 8);

function FaqAccordion({
  items,
}: {
  items: FaqItem[];
}) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="divide-y divide-[var(--card-border)] rounded-2xl border border-[var(--card-border)] bg-card overflow-hidden">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? -1 : index)}
              className="w-full flex items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left hover:bg-muted/30 transition-colors"
              aria-expanded={open}
            >
              <span className="text-sm sm:text-[15px] font-semibold text-foreground leading-snug pr-2">
                {item.question}
              </span>
              <span
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200 mt-0.5",
                  open
                    ? "bg-primary/10 border-primary/20 rotate-180"
                    : "bg-[var(--bg-secondary)] border-[var(--card-border)]",
                )}
              >
                <ChevronDown className="w-4 h-4 text-primary" />
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
                  <div className="px-5 sm:px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
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
    <div className="rounded-2xl border border-[var(--card-border)] bg-card p-6 sm:p-7 shadow-[0_8px_30px_rgba(15,23,42,0.06)] h-fit lg:sticky lg:top-28">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <MessageCircle className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">Still have questions?</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        Our support team is here to help you succeed.
      </p>
      <Link
        href="mailto:support@profytron.com"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] bg-card text-sm font-semibold text-primary hover:bg-muted/50 transition-colors"
      >
        Contact Support
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export function FaqSection() {
  return (
    <section className="relative pb-20 sm:pb-28 bg-[var(--bg-secondary)] dark:bg-background" id="faq">

      <div className="page-container max-w-[1200px]">
        <div className="rounded-[28px] sm:rounded-[32px] border border-[var(--card-border)] bg-[#F3F5FA] dark:bg-card/50 p-6 sm:p-8 lg:p-10 xl:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3 lg:pt-2"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Frequently Asked Questions
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
                Everything you need to know
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Can&apos;t find an answer? Reach our support team in-app or at{" "}
                <a
                  href="mailto:support@profytron.com"
                  className="text-primary font-medium hover:underline underline-offset-4"
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
              className="lg:col-span-5"
            >
              <FaqAccordion items={LANDING_FAQ_ITEMS} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              className="lg:col-span-4"
            >
              <SupportCard />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

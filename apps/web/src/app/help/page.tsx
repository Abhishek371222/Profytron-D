'use client';

import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  HELP_FAQ_ENTRIES,
  HELP_SECTIONS,
  searchHelpFaqs,
  slugifyFaqId,
  type HelpCategoryId,
  type HelpFaqEntry,
} from '@/lib/help/help-catalog';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import {
  MarketingHero,
  MarketingSection,
} from '@/components/marketing/MarketingPage';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CircleHelp,
  FileQuestion,
  Headphones,
  Link2,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics/track';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

const FAQ_CATEGORIES: { id: HelpCategoryId | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'getting-started', label: 'Getting started' },
  { id: 'billing', label: 'Billing' },
  { id: 'brokers', label: 'Brokers' },
  { id: 'alpha-coach', label: 'Alpha Coach' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'security', label: 'Security' },
  { id: 'support', label: 'Support' },
  { id: 'trading', label: 'Trading' },
  { id: 'risk', label: 'Risk' },
];

function highlightMatch(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-primary/15 px-0.5 text-foreground">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function HelpFaqAccordion({
  items,
  query,
  openId,
  onOpenId,
}: {
  items: HelpFaqEntry[];
  query: string;
  openId: string | null;
  onOpenId: (id: string | null) => void;
}) {
  const reduceMotion = useReducedMotion();
  const baseId = useId();

  if (items.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--card-border)] bg-card/60 px-6 py-14 text-center"
      >
        <FileQuestion className="h-10 w-10 text-muted-foreground" aria-hidden />
        <h3 className="text-base font-semibold text-foreground">No matching FAQs</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Try another keyword, clear filters, or open a support ticket if you still need help.
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <Link
            href="/settings/support"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Contact support
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Read docs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--card-border)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card">
      {items.map((item) => {
        const panelId = slugifyFaqId(item.id);
        const open = openId === item.id;
        const btnId = `${baseId}-${item.id}`;
        return (
          <div key={item.id} id={panelId}>
            <div className="flex items-start">
              <button
                id={btnId}
                type="button"
                onClick={() => {
                  const next = open ? null : item.id;
                  onOpenId(next);
                  if (next) {
                    trackEvent('help_faq_expand', { faq_id: item.id, category: item.category });
                    if (typeof window !== 'undefined') {
                      window.history.replaceState(null, '', `#${panelId}`);
                    }
                  }
                }}
                className="flex min-w-0 flex-1 items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-6 sm:py-5"
                aria-expanded={open}
                aria-controls={`${btnId}-panel`}
              >
                <span className="pr-2 text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
                  {highlightMatch(item.question, query)}
                </span>
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200',
                    open
                      ? 'rotate-180 border-primary/20 bg-primary/10'
                      : 'border-[var(--card-border)] bg-[var(--bg-secondary)]',
                  )}
                  aria-hidden
                >
                  <ChevronDown className="h-4 w-4 text-primary" />
                </span>
              </button>
              <button
                type="button"
                className="mr-3 mt-4 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Copy link to: ${item.question}`}
                onClick={async () => {
                  const url = `${window.location.origin}/help#${panelId}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    trackEvent('help_faq_copy_link', { faq_id: item.id });
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <Link2 className="h-4 w-4" />
              </button>
            </div>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={`${btnId}-panel`}
                  role="region"
                  aria-labelledby={btnId}
                  key="answer"
                  initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6">
                    {highlightMatch(item.answer, query)}
                    <p className="mt-3 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[var(--card-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </p>
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

export default function HelpPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<HelpCategoryId | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(HELP_FAQ_ENTRIES[0]?.id ?? null);
  const searchInputId = useId();
  const reduceMotion = useReducedMotion();

  const results = useMemo(
    () => searchHelpFaqs(query, category),
    [query, category],
  );

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
    if (!hash.startsWith('faq-')) return;
    const id = hash.replace(/^faq-/, '');
    if (HELP_FAQ_ENTRIES.some((e) => e.id === id)) {
      setOpenId(id);
      requestAnimationFrame(() => {
        document.getElementById(slugifyFaqId(id))?.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      });
    }
  }, [reduceMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById(searchInputId)?.focus();
      }
      if (e.key === 'Escape' && query) setQuery('');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [query, searchInputId]);

  const onSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.trim().length >= 2) {
      trackEvent('help_search', { q_len: value.trim().length });
    }
  }, []);

  return (
    <PublicPageLayout>
      <MarketingHero
        eyebrow="Help Center"
        eyebrowIcon={CircleHelp}
        title="Answers,"
        titleAccent="paths & support."
        description="Search FAQs, browse topics from getting started to Alpha Coach, or open a ticket. Built for future expansion without rewrites."
        sceneKey="heroTrading"
      />

      <MarketingSection narrow className="pb-8">
        <label htmlFor={searchInputId} className="sr-only">
          Search help articles and FAQs
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id={searchInputId}
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search FAQs… (Ctrl/Cmd+K)"
            className="h-12 w-full rounded-xl border border-[var(--card-border)] bg-card py-2 pl-10 pr-10 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            autoComplete="off"
            enterKeyHint="search"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
          {results.length} FAQ{results.length === 1 ? '' : 's'}
          {query.trim() ? ` matching “${query.trim()}”` : ''}
        </p>
      </MarketingSection>

      <MarketingSection narrow className="pb-6">
        <div
          role="tablist"
          aria-label="FAQ categories"
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {FAQ_CATEGORIES.map((cat) => {
            const selected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-[var(--card-border)] bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection narrow className="pb-12">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">Frequently asked questions</h2>
          <Link
            href="/alpha-coach"
            className="hidden items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:inline-flex"
          >
            Ask Alpha Coach <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <HelpFaqAccordion
          items={results}
          query={query}
          openId={openId}
          onOpenId={setOpenId}
        />
      </MarketingSection>

      <MarketingSection className="pb-10">
        <h2 className="mb-2 text-lg font-bold text-foreground">Browse by topic</h2>
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
          Every section links into product surfaces so help scales without a page rewrite.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HELP_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={`help-${section.id}`}
              className="rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card p-5"
            >
              <div className="mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" aria-hidden />
                <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{section.description}</p>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={`${section.id}-${link.href}`}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...(link.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                      <span className="group-hover:underline underline-offset-4">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection narrow className="pb-20">
        <div
          role="region"
          aria-label="Still need help"
          className="flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-[var(--card-border)] bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex gap-3">
            <Headphones className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="text-base font-semibold text-foreground">Still stuck?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Open a ticket, check status, or ask Alpha Coach with your live book context.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/settings/support"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Open ticket
            </Link>
            <Link
              href="/status"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--card-border)] bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              System status
            </Link>
            <Link
              href="/alpha-coach"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--card-border)] bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Alpha Coach
            </Link>
          </div>
        </div>
        <div className="mt-8">
          <Breadcrumbs items={[{ label: 'Help' }]} />
        </div>
      </MarketingSection>
    </PublicPageLayout>
  );
}
